# RISE Rwanda — Claude Instructions

These rules apply every session. Do not wait to be reminded.

## Skills to invoke automatically

### Frontend / UI work
Always invoke the `frontend-design` skill before writing any web component, page, or dashboard UI.
Victor finds default AI-generated aesthetics unacceptable.

**Victor's required design style — Modern Monochrome (navy + blue):**
- Dark navy left sidebar (`#16213E`, ~160px wide), icon + label side-by-side
- Page background: `#C8C8C8` — medium grey, never white or light grey
- Cards: `#F0F0F0`, border-radius 12–16px, `1px #EBEBEB` border
- Accent: `#3B82F6` sky blue — active nav indicator + one key stat only
- Font: `Plus Jakarta Sans` (bold numbers, medium labels)
- Buttons: solid `#16213E`, white text, rounded
- Stats: large bold number + small grey label; hero card inverted (`#16213E` bg)
- Charts: navy tonal scale (`#16213E` → `#2A4A7F` → `#7BAFD4` → `#C2D8EE`)
- Text: primary `#1A1A1A`, secondary `#444444`, muted `#666666`
- NO pure black (`#000`/`#111`) — always use `#16213E` as the darkest tone

### Writing — always invoke for any generated text
Always invoke the `writing` skill before drafting or editing **any** text output
intended for Victor: professional documents, reports, emails, formal content,
UI copy, tooltips, error messages, labels, or any text that will be read by others.

### Code review / verification
After completing any non-trivial code change, run the `verify` or `code-review` skill
to confirm the change behaves correctly at the surface (not just builds).

---

## Task tracking — required on every session

Use `TaskCreate` at the start of any multi-step task to list the work.
Use `TaskUpdate` to mark each step `in_progress` when starting it and `completed` when done.
After each step, run a quick validation (curl, build check, or unit assertion) and record the result.
Never report a task as done without observed evidence that it works.

---

## Project context

- **Stack**: Python (FastAPI) backend on port 8000 + React/Vite frontend on port 5173
- **Data**: OLI Torus CSV exports — one file per learning site, filename = site name
- **Persistence**: `dashboard/data/sites.json` survives restarts
- **Node version**: must use Node 20.20.2 (`nvm use 20.20.2`) — Node 18 is too old for Vite 8
- **Start command**: `bash /Users/victormiene/Desktop/RISE/dashboard/start.sh`
- **Google Drive sync**: POST `/api/sync-drive` with `{ url }` — folder must be shared publicly
- **Completion threshold**: Progress (Pct) >= 100 counts as completed

## Required metrics (from spec doc)
1. Total learners enrolled
2. % who completed (Progress = 100)
3. Avg learners at high proficiency per site
4. Avg learners at medium proficiency per site
5. Active users per site
6. Completion rates by site
7. Learners with "Not enough data"
