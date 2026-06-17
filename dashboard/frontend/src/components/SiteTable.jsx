import { useState } from "react";

const COLS = [
  { key: "pct_completed",      label: "% Done"   },
  { key: "total_enrolled",     label: "Enrolled"  },
  { key: "completed",          label: "Completed" },
  { key: "active_users",       label: "Active"    },
  { key: "high_proficiency",   label: "High"      },
  { key: "medium_proficiency", label: "Medium"    },
  { key: "not_enough_data",    label: "No Data"   },
];

export default function SiteTable({ api, sites, onRefresh }) {
  const [search, setSearch]     = useState("");
  const [sortBy, setSortBy]     = useState("pct_completed");
  const [sortDir, setSortDir]   = useState("desc");
  const [deleting, setDeleting] = useState(null);

  const filtered = sites
    .filter((s) => s.site_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (sortDir === "desc" ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy]));

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => d === "desc" ? "asc" : "desc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const handleDelete = async (name) => {
    if (!confirm(`Remove "${name}"?`)) return;
    setDeleting(name);
    await fetch(`${api}/api/sites/${encodeURIComponent(name)}`, { method: "DELETE" });
    setDeleting(null);
    onRefresh();
  };

  const exportCSV = () => {
    const headers = ["Site Name", ...COLS.map((c) => c.label)];
    const rows = filtered.map((s) => [s.site_name, ...COLS.map((c) => s[c.key])]);
    const blob = new Blob([[headers, ...rows].map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: "RISE_aggregated_analytics.csv",
    }).click();
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sites…"
            style={{
              width: "100%", padding: "9px 14px 9px 36px",
              border: "1px solid var(--border)", borderRadius: 8,
              background: "var(--card)", color: "var(--ink)",
              fontFamily: "var(--font-sans)", fontSize: 14,
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#999"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-light)", fontSize: 15 }}>⌕</span>
        </div>
        <span style={{ fontSize: 12, color: "var(--ink-light)", fontWeight: 500, whiteSpace: "nowrap" }}>
          {filtered.length} / {sites.length} sites
        </span>
        <button onClick={exportCSV} style={{
          background: "var(--ink)", color: "#fff",
          border: "none", padding: "9px 18px",
          borderRadius: 8, fontWeight: 600, fontSize: 13,
          cursor: "pointer", letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          transition: "opacity 0.15s",
        }}>
          Export CSV
        </button>
      </div>

      {/* Table card */}
      <div style={{
        background: "var(--card)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{
                padding: "11px 18px", textAlign: "left",
                fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
                textTransform: "uppercase", color: "var(--ink-light)",
                background: "#FAFAFA",
              }}>
                Site Name
              </th>
              {COLS.map((c) => (
                <th key={c.key} onClick={() => handleSort(c.key)} style={{
                  padding: "11px 14px", textAlign: "right",
                  fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: sortBy === c.key ? "var(--ink)" : "var(--ink-light)",
                  background: "#FAFAFA",
                  cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
                  transition: "color 0.1s",
                }}>
                  {c.label} {sortBy === c.key ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
              ))}
              <th style={{ padding: "11px 14px", background: "#FAFAFA", width: 44 }} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.site_name} style={{
                borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <td style={{ padding: "11px 18px", fontWeight: 600, color: "var(--ink)", fontSize: 14 }}>
                  {s.site_name}
                </td>
                {/* % Done with inline bar */}
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                    <div style={{ width: 48, height: 3, background: "var(--border)", borderRadius: 2 }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.min(100, s.pct_completed)}%`,
                        background: "var(--ink)",
                        borderRadius: 2,
                      }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", minWidth: 38, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {s.pct_completed}%
                    </span>
                  </div>
                </td>
                {COLS.slice(1).map((c) => (
                  <td key={c.key} style={{
                    padding: "11px 14px", textAlign: "right",
                    fontSize: 13, color: "var(--ink-mid)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {s[c.key]}
                  </td>
                ))}
                <td style={{ padding: "11px 14px", textAlign: "center" }}>
                  <button
                    onClick={() => handleDelete(s.site_name)}
                    disabled={deleting === s.site_name}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--ink-light)", fontSize: 18, padding: "2px 4px",
                      opacity: deleting === s.site_name ? 0.3 : 1,
                      lineHeight: 1,
                      transition: "color 0.1s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-light)"}
                  >×</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLS.length + 2} style={{ padding: "48px", textAlign: "center", color: "var(--ink-light)", fontSize: 13 }}>
                  No sites match "{search}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
