import { useState, useRef } from "react";

const BATCH_SIZE = 50;

export default function Upload({ api, onComplete }) {
  const [dragging, setDragging]         = useState(false);
  const [files, setFiles]               = useState([]);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [progress, setProgress]         = useState(null);

  const [driveUrl, setDriveUrl]     = useState("");
  const [syncing, setSyncing]       = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const fileInputRef   = useRef();
  const folderInputRef = useRef();

  const addFiles = (incoming) => {
    const csvs = Array.from(incoming).filter((f) => f.name.toLowerCase().endsWith(".csv") && f.size > 0);
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...csvs.filter((f) => !existing.has(f.name))];
    });
  };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true); setUploadStatus(null);
    const allUploaded = [], allErrors = [];
    let totalSites = 0;
    const batches = [];
    for (let i = 0; i < files.length; i += BATCH_SIZE) batches.push(files.slice(i, i + BATCH_SIZE));

    for (let b = 0; b < batches.length; b++) {
      setProgress({ current: b * BATCH_SIZE, total: files.length, batch: b + 1, batches: batches.length });
      const form = new FormData();
      batches[b].forEach((f) => form.append("files", f));
      try {
        const res = await fetch(`${api}/api/upload`, { method: "POST", body: form });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data = await res.json();
        allUploaded.push(...data.uploaded);
        allErrors.push(...data.errors);
        totalSites = data.total_sites;
      } catch (err) {
        allErrors.push({ file: `Batch ${b + 1}`, error: err.message });
      }
    }
    setProgress(null);
    setUploadStatus({ uploaded: allUploaded, errors: allErrors, total_sites: totalSites });
    setFiles([]);
    if (allUploaded.length > 0) onComplete();
    setUploading(false);
  };

  const handleDriveSync = async () => {
    if (!driveUrl.trim()) return;
    setSyncing(true); setSyncStatus(null);
    try {
      const res = await fetch(`${api}/api/sync-drive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: driveUrl.trim() }),
      });
      const data = await res.json();
      setSyncStatus(data);
      if (data.uploaded?.length > 0) onComplete();
    } catch {
      setSyncStatus({ error: "Could not reach server. Is the backend running?" });
    } finally {
      setSyncing(false);
    }
  };

  const canUpload = files.length > 0 && !uploading;

  return (
    <div style={{ maxWidth: 580, margin: "0 auto" }}>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 8, letterSpacing: "-0.02em" }}>
          Add Learner Data
        </h2>
        <p style={{ color: "var(--ink-light)", fontSize: 14, lineHeight: 1.7 }}>
          Each CSV file should be one site's export from OLI Torus. The filename becomes the site name.
          Re-uploading a site overwrites its previous data.
        </p>
      </div>

      {/* Drive tip card */}
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "14px 18px",
        marginBottom: 24,
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 16, marginTop: 1 }}>📥</span>
        <div>
          <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 14, marginBottom: 3 }}>
            Downloading from Google Drive?
          </div>
          <div style={{ color: "var(--ink-mid)", fontSize: 13, lineHeight: 1.6 }}>
            Right-click the CSV folder → <strong>Download</strong> → unzip → use <strong>Choose Folder</strong> below. All sites load in one click.
          </div>
        </div>
      </div>

      {/* Drive sync (public folders only) */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 10 }}>
          Sync from Google Drive — public folders only
        </div>
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "16px 18px",
          opacity: 0.75,
        }}>
          <p style={{ color: "var(--ink-mid)", fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
            Only works if the folder is shared as <strong>"Anyone with the link can view."</strong>
            For restricted folders, use the manual workflow above.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/…"
              style={{
                flex: 1, padding: "9px 14px",
                border: "1px solid var(--border)", borderRadius: 8,
                background: "#fff", color: "var(--ink)",
                fontFamily: "var(--font-sans)", fontSize: 13,
                outline: "none",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleDriveSync()}
            />
            <button
              onClick={handleDriveSync}
              disabled={!driveUrl.trim() || syncing}
              style={{
                background: driveUrl.trim() && !syncing ? "var(--ink)" : "var(--border)",
                color: driveUrl.trim() && !syncing ? "#fff" : "var(--ink-light)",
                border: "none", padding: "9px 20px",
                borderRadius: 8, fontWeight: 600, fontSize: 13,
                cursor: driveUrl.trim() && !syncing ? "pointer" : "not-allowed",
                whiteSpace: "nowrap",
                transition: "background 0.15s",
              }}
            >
              {syncing ? "Syncing…" : "Sync"}
            </button>
          </div>
          {syncStatus && <StatusBox status={syncStatus} />}
        </div>
      </div>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "28px 0" }}>
        <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-light)" }}>upload directly</span>
        <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      {/* Drop zone */}
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 10 }}>
        Upload CSV Files
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? "var(--ink)" : "var(--border)"}`,
          borderRadius: 12,
          padding: "36px 24px",
          textAlign: "center",
          background: dragging ? "rgba(0,0,0,0.02)" : "var(--card)",
          transition: "border-color 0.15s, background 0.15s",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.05em", color: "var(--ink-light)", marginBottom: 14 }}>
          Drop files here
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={() => fileInputRef.current.click()} style={{
            background: "var(--ink)", color: "#fff",
            border: "none", padding: "9px 20px",
            borderRadius: 8, fontWeight: 600, fontSize: 13,
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}>
            Choose Files
          </button>
          <button onClick={() => folderInputRef.current.click()} style={{
            background: "transparent", color: "var(--ink)",
            border: "1px solid var(--border)", padding: "9px 20px",
            borderRadius: 8, fontWeight: 500, fontSize: 13,
            cursor: "pointer",
            transition: "border-color 0.15s",
          }}>
            Choose Folder
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".csv" multiple hidden onChange={(e) => addFiles(e.target.files)} />
        <input ref={folderInputRef} type="file" webkitdirectory="" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>

      {/* File queue */}
      {files.length > 0 && (
        <div style={{ marginTop: 12, border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--card)" }}>
          <div style={{
            padding: "9px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 12, fontWeight: 500, color: "var(--ink-light)",
            letterSpacing: "0.04em",
          }}>
            <span>{files.length} files queued</span>
            <span>{(files.reduce((s, f) => s + f.size, 0) / 1024).toFixed(0)} KB</span>
          </div>
          <div style={{ maxHeight: 160, overflowY: "auto" }}>
            {files.slice(0, 80).map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center",
                padding: "7px 16px",
                borderBottom: i < Math.min(files.length, 80) - 1 ? "1px solid var(--border)" : "none",
              }}>
                <span style={{ flex: 1, color: "var(--ink-mid)", fontSize: 13 }}>{f.name}</span>
                <span style={{ fontSize: 12, color: "var(--ink-light)", marginRight: 10 }}>
                  {(f.size / 1024).toFixed(1)}k
                </span>
                <button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--ink-light)", fontSize: 16, padding: 0, lineHeight: 1,
                }}>×</button>
              </div>
            ))}
            {files.length > 80 && (
              <div style={{ padding: "8px 16px", fontSize: 12, color: "var(--ink-light)" }}>
                …and {files.length - 80} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {progress && (
        <div style={{ marginTop: 12, padding: "12px 16px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-light)", marginBottom: 8 }}>
            Batch {progress.batch}/{progress.batches} · {progress.current}/{progress.total} files
          </div>
          <div style={{ height: 3, background: "var(--border)", borderRadius: 2 }}>
            <div style={{
              height: "100%",
              width: `${(progress.current / progress.total) * 100}%`,
              background: "var(--ink)", borderRadius: 2,
              transition: "width 0.3s",
            }} />
          </div>
        </div>
      )}

      {/* Upload button */}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={handleUpload} disabled={!canUpload} style={{
          flex: 1,
          background: canUpload ? "var(--ink)" : "var(--border)",
          color: canUpload ? "#fff" : "var(--ink-light)",
          border: "none", padding: "11px",
          borderRadius: 8, fontWeight: 700, fontSize: 14,
          cursor: canUpload ? "pointer" : "not-allowed",
          letterSpacing: "0.01em",
          transition: "background 0.15s",
        }}>
          {uploading ? "Uploading…" : `Upload ${files.length || ""} File${files.length !== 1 ? "s" : ""}`}
        </button>
        {files.length > 0 && !uploading && (
          <button onClick={() => setFiles([])} style={{
            padding: "11px 18px", background: "transparent",
            border: "1px solid var(--border)", borderRadius: 8,
            cursor: "pointer", color: "var(--ink-light)",
            fontSize: 14,
          }}>Clear</button>
        )}
      </div>

      {uploadStatus && <StatusBox status={uploadStatus} />}
    </div>
  );
}

function StatusBox({ status }) {
  if (status.error) {
    return (
      <div style={{ marginTop: 14, padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10 }}>
        <span style={{ color: "#991B1B", fontSize: 13 }}>{status.error}</span>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 14, padding: "12px 16px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10 }}>
      <div style={{ color: "#166534", fontWeight: 700, fontSize: 14, marginBottom: status.errors?.length ? 8 : 0 }}>
        ✓ {status.uploaded?.length} site{status.uploaded?.length !== 1 ? "s" : ""} loaded · {status.total_sites} total
      </div>
      {status.errors?.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #BBF7D0" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#B91C1C", marginBottom: 6 }}>
            {status.errors.length} skipped
          </div>
          {status.errors.slice(0, 8).map((e, i) => (
            <div key={i} style={{ fontSize: 12, color: "#991B1B", marginTop: 3 }}>
              <strong>{e.file}:</strong> {e.error}
            </div>
          ))}
          {status.errors.length > 8 && (
            <div style={{ fontSize: 12, color: "#991B1B", marginTop: 4 }}>…and {status.errors.length - 8} more</div>
          )}
        </div>
      )}
    </div>
  );
}
