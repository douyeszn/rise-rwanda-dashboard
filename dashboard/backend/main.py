import asyncio
import io
import json
import os
import re
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from pydantic import BaseModel

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

_executor = ThreadPoolExecutor(max_workers=2)

app = FastAPI(title="RISE Analytics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).parent.parent / "data"
SITES_FILE = DATA_DIR / "sites.json"
DATA_DIR.mkdir(exist_ok=True)


def load_sites() -> dict:
    if SITES_FILE.exists():
        return json.loads(SITES_FILE.read_text())
    return {}


def save_sites(sites: dict):
    SITES_FILE.write_text(json.dumps(sites, indent=2, default=str))


def site_name_from_filename(filename: str) -> str:
    name = Path(filename).stem
    name = re.sub(r"[-_]+", " ", name)
    return name.strip().title()


COLUMN_ALIASES = {
    # progress variations
    "progress (pct)": "Progress (Pct)",
    "progress(pct)": "Progress (Pct)",
    "progress %": "Progress (Pct)",
    "progress": "Progress (Pct)",
    "completion (pct)": "Progress (Pct)",
    # proficiency variations
    "proficiency": "Proficiency",
    "proficiency level": "Proficiency",
    # status variations
    "status": "Status",
    "enrollment status": "Status",
    # last interaction variations
    "last interaction": "Last Interaction",
    "last activity": "Last Interaction",
    "last accessed": "Last Interaction",
}

PROFICIENCY_ALIASES = {
    "high": "High",
    "medium": "Medium",
    "med": "Medium",
    "low": "Low",
    "not enough data": "Not enough data",
    "notenoughdata": "Not enough data",
    "n/a": "Not enough data",
    "": "Not enough data",
}


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    renamed = {}
    for col in df.columns:
        normalized = col.strip().lower()
        if normalized in COLUMN_ALIASES:
            renamed[col] = COLUMN_ALIASES[normalized]
    return df.rename(columns=renamed)


def read_csv_robust(content: bytes) -> pd.DataFrame:
    """Try multiple encodings and handle BOM characters."""
    for encoding in ("utf-8-sig", "utf-8", "latin-1", "cp1252"):
        try:
            df = pd.read_csv(io.BytesIO(content), encoding=encoding, skip_blank_lines=True)
            if len(df.columns) > 1:
                return df
        except Exception:
            continue
    raise ValueError("Could not parse CSV — check the file encoding and format.")


def process_csv(content: bytes, site_name: str) -> dict:
    df = read_csv_robust(content)
    df = normalize_columns(df)

    required = {"Progress (Pct)", "Proficiency", "Status"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(
            f"CSV missing columns: {sorted(missing)}. "
            f"Found: {list(df.columns)[:10]}{'...' if len(df.columns) > 10 else ''}"
        )

    # Drop completely empty rows
    df = df.dropna(how="all")

    total_enrolled = len(df)
    if total_enrolled == 0:
        raise ValueError("CSV has no learner rows (file is empty or only has a header).")

    # Normalize Progress (Pct): strip % if present, coerce to numeric, clamp 0-100
    progress = df["Progress (Pct)"].astype(str).str.replace("%", "", regex=False).str.strip()
    df["Progress (Pct)"] = pd.to_numeric(progress, errors="coerce").clip(0, 100).fillna(0)

    completed = int((df["Progress (Pct)"] >= 100).sum())
    pct_completed = round(completed / total_enrolled * 100, 2)

    # Normalize proficiency: lowercase → canonical label
    prof = (
        df["Proficiency"]
        .astype(str)
        .str.strip()
        .str.lower()
        .map(lambda v: PROFICIENCY_ALIASES.get(v, v.title()))
    )
    proficiency_counts = prof.value_counts().to_dict()
    high_count = int(proficiency_counts.get("High", 0))
    medium_count = int(proficiency_counts.get("Medium", 0))
    low_count = int(proficiency_counts.get("Low", 0))
    not_enough_data = int(proficiency_counts.get("Not enough data", 0))

    active_count = total_enrolled
    if "Last Interaction" in df.columns:
        active_count = int(df["Last Interaction"].notna().sum())

    return {
        "site_name": site_name,
        "total_enrolled": total_enrolled,
        "completed": completed,
        "pct_completed": pct_completed,
        "active_users": active_count,
        "high_proficiency": high_count,
        "medium_proficiency": medium_count,
        "low_proficiency": low_count,
        "not_enough_data": not_enough_data,
    }


@app.post("/api/upload")
async def upload_csvs(files: list[UploadFile] = File(...)):
    sites = load_sites()
    results = []
    errors = []

    for file in files:
        # Strip any subfolder path (e.g. "RISE_CSVs/site.csv" → "site.csv")
        bare_name = Path(file.filename).name if file.filename else ""
        if not bare_name.lower().endswith(".csv"):
            errors.append({"file": file.filename, "error": "Not a CSV file"})
            continue
        if not bare_name.strip():
            errors.append({"file": file.filename, "error": "Empty filename"})
            continue
        try:
            content = await file.read()
            if not content.strip():
                errors.append({"file": file.filename, "error": "File is empty"})
                continue
            site_name = site_name_from_filename(bare_name)
            site_data = process_csv(content, site_name)
            sites[site_name] = site_data
            results.append(site_name)
        except Exception as e:
            errors.append({"file": file.filename, "error": str(e)})

    save_sites(sites)
    return {"uploaded": results, "errors": errors, "total_sites": len(sites)}


@app.get("/api/sites")
def get_sites():
    sites = load_sites()
    return {"sites": list(sites.values()), "count": len(sites)}


@app.get("/api/analytics")
def get_analytics():
    sites = load_sites()
    if not sites:
        return {
            "total_enrolled": 0,
            "total_completed": 0,
            "pct_completed": 0,
            "total_active": 0,
            "avg_high_proficiency": 0,
            "avg_medium_proficiency": 0,
            "total_not_enough_data": 0,
            "site_count": 0,
            "sites": [],
        }

    site_list = list(sites.values())
    total_enrolled = sum(s["total_enrolled"] for s in site_list)
    total_completed = sum(s["completed"] for s in site_list)
    total_active = sum(s["active_users"] for s in site_list)
    total_high = sum(s["high_proficiency"] for s in site_list)
    total_medium = sum(s["medium_proficiency"] for s in site_list)
    total_not_enough = sum(s["not_enough_data"] for s in site_list)

    pct_completed = round(total_completed / total_enrolled * 100, 2) if total_enrolled else 0
    n = len(site_list)

    return {
        "total_enrolled": total_enrolled,
        "total_completed": total_completed,
        "pct_completed": pct_completed,
        "total_active": total_active,
        "avg_high_proficiency": round(total_high / n, 1) if n else 0,
        "avg_medium_proficiency": round(total_medium / n, 1) if n else 0,
        "total_not_enough_data": total_not_enough,
        "site_count": n,
        "sites": sorted(site_list, key=lambda x: x["pct_completed"], reverse=True),
    }


@app.delete("/api/sites/{site_name}")
def delete_site(site_name: str):
    sites = load_sites()
    if site_name not in sites:
        raise HTTPException(status_code=404, detail="Site not found")
    del sites[site_name]
    save_sites(sites)
    return {"deleted": site_name}


@app.delete("/api/sites")
def clear_all():
    save_sites({})
    return {"message": "All site data cleared"}


class DriveSyncRequest(BaseModel):
    url: str


@app.post("/api/sync-drive")
async def sync_drive(body: DriveSyncRequest):
    url = body.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    if "drive.google.com" not in url and "docs.google.com" not in url:
        raise HTTPException(status_code=400, detail="URL must be a Google Drive link")

    def _download_and_process():
        try:
            import gdown
        except ImportError:
            raise RuntimeError("gdown not installed. Run: pip install gdown")

        results, errors = [], []
        with tempfile.TemporaryDirectory() as tmp:
            is_folder = "/folders/" in url

            if is_folder:
                try:
                    # gdown returns the list of downloaded file paths
                    downloaded = gdown.download_folder(
                        url, output=tmp, quiet=True, use_cookies=False
                    )
                    if downloaded is None:
                        raise RuntimeError(
                            "Could not download folder. Make sure sharing is set to "
                            "'Anyone with the link can view'."
                        )
                except Exception as e:
                    raise RuntimeError(f"Folder download failed: {e}")
            else:
                # Single file
                out_path = os.path.join(tmp, "drive_file.csv")
                try:
                    gdown.download(url, out_path, quiet=True, fuzzy=True)
                except Exception as e:
                    raise RuntimeError(f"File download failed: {e}")

            # Process every .csv found in tmp (recursively)
            csv_files = list(Path(tmp).rglob("*.csv"))
            if not csv_files:
                raise RuntimeError(
                    "No CSV files found. Make sure the Drive folder contains .csv files "
                    "and is shared publicly."
                )

            sites = load_sites()
            for csv_path in csv_files:
                bare_name = csv_path.name
                try:
                    content = csv_path.read_bytes()
                    if not content.strip():
                        errors.append({"file": bare_name, "error": "File is empty"})
                        continue
                    site_name = site_name_from_filename(bare_name)
                    site_data = process_csv(content, site_name)
                    sites[site_name] = site_data
                    results.append(site_name)
                except Exception as e:
                    errors.append({"file": bare_name, "error": str(e)})

            save_sites(sites)
            return {"uploaded": results, "errors": errors, "total_sites": len(sites)}

    try:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(_executor, _download_and_process)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
