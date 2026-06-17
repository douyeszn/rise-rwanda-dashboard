import { useState, useEffect, useCallback } from "react";
import Upload from "./components/Upload";
import Summary from "./components/Summary";
import SiteTable from "./components/SiteTable";
import SiteChart from "./components/SiteChart";
import ProficiencyChart from "./components/ProficiencyChart";

const API = "http://localhost:8000";

const OverviewIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="6" height="6" rx="1.5"/>
    <rect x="11" y="3" width="6" height="6" rx="1.5"/>
    <rect x="3" y="11" width="6" height="6" rx="1.5"/>
    <rect x="11" y="11" width="6" height="6" rx="1.5"/>
  </svg>
);

const SitesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M3 5.5h14M3 10h14M3 14.5h14"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13.5V7.5"/>
    <path d="M7.5 10L10 7.5 12.5 10"/>
    <path d="M5 16.5h10"/>
  </svg>
);

const TABS = [
  { id: "overview", label: "Overview", Icon: OverviewIcon, tip: "Summary stats, charts and proficiency breakdown across all sites" },
  { id: "sites",    label: "By Site",  Icon: SitesIcon,    tip: "Sortable table of every site — completion %, active learners, proficiency counts" },
  { id: "upload",   label: "Add Data", Icon: UploadIcon,   tip: "Upload OLI Torus CSV exports or sync from Google Drive" },
];

export default function App() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState("overview");

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/analytics`);
      setAnalytics(await res.json());
    } catch {
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
  const onDataChange = () => { fetchAnalytics(); setTab("overview"); };

  const hasData = analytics && analytics.site_count > 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <nav style={{
        width: 160,
        background: "var(--sidebar)",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "20px 12px",
        zIndex: 100,
      }}>
        {/* Wordmark */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingLeft: 8,
          marginBottom: 36,
        }}>
          <div style={{
            width: 32, height: 32,
            background: "#fff",
            borderRadius: 9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#16213E", letterSpacing: "-0.03em" }}>R</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: "0.04em" }}>RISE</span>
        </div>

        {/* Nav items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
          {TABS.map(({ id, label, Icon, tip }) => {
            const active = tab === id;
            return (
              <div key={id} style={{ position: "relative" }} className={`nav-item-wrap`}
                onMouseEnter={(e) => {
                  const tt = e.currentTarget.querySelector(".nav-tooltip");
                  if (tt) tt.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  const tt = e.currentTarget.querySelector(".nav-tooltip");
                  if (tt) tt.style.opacity = "0";
                }}
              >
                <button
                  onClick={() => setTab(id)}
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    paddingLeft: active ? 8 : 10,
                    borderRadius: 10,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    background: active ? "rgba(255,255,255,0.10)" : "transparent",
                    border: "none",
                    borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                    color: active ? "#fff" : "rgba(255,255,255,0.4)",
                    cursor: "pointer",
                    transition: "background 0.15s, color 0.15s, border-color 0.15s",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon />
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, letterSpacing: "0.01em" }}>{label}</span>
                </button>

                {/* Tooltip */}
                <div className="nav-tooltip" style={{
                  position: "absolute",
                  left: "calc(100% + 12px)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "#1A1A1A",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 400,
                  lineHeight: 1.5,
                  padding: "7px 12px",
                  borderRadius: 8,
                  whiteSpace: "nowrap",
                  maxWidth: 260,
                  whiteSpace: "normal",
                  pointerEvents: "none",
                  zIndex: 200,
                  opacity: 0,
                  transition: "opacity 0.15s",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                }}>
                  {tip}
                  {/* Arrow */}
                  <span style={{
                    position: "absolute",
                    right: "100%",
                    top: "50%",
                    transform: "translateY(-50%)",
                    borderWidth: 5,
                    borderStyle: "solid",
                    borderColor: "transparent #1A1A1A transparent transparent",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div style={{ marginLeft: 160, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <header style={{
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
          padding: "0 36px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              {TABS.find((t) => t.id === tab)?.label}
            </span>
            {tab === "overview" && hasData && (
              <span style={{ marginLeft: 12, fontSize: 13, color: "var(--ink-light)", fontWeight: 400 }}>
                {analytics.site_count} sites · {analytics.total_enrolled.toLocaleString()} learners
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-light)", fontWeight: 500, letterSpacing: "0.04em" }}>
            RISE RWANDA
          </div>
        </header>

        {/* Main */}
        <main style={{ flex: 1, padding: "32px 36px 60px" }}>
          {loading ? (
            <div style={{ paddingTop: 80, textAlign: "center", color: "var(--ink-light)", fontSize: 13, letterSpacing: "0.05em" }}>
              Loading…
            </div>
          ) : tab === "upload" ? (
            <Upload api={API} onComplete={onDataChange} />
          ) : tab === "sites" ? (
            <SiteTable api={API} sites={analytics?.sites || []} onRefresh={fetchAnalytics} />
          ) : !hasData ? (
            <EmptyState onUpload={() => setTab("upload")} />
          ) : (
            <>
              <Summary analytics={analytics} />
              <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, marginTop: 20 }}>
                <SiteChart sites={analytics.sites} />
                <ProficiencyChart sites={analytics.sites} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyState({ onUpload }) {
  return (
    <div style={{ paddingTop: 80, textAlign: "center" }}>
      <div style={{
        width: 56, height: 56,
        borderRadius: 16,
        background: "var(--card)",
        border: "1px solid var(--border)",
        margin: "0 auto 24px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24,
      }}>
        📊
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 10, letterSpacing: "-0.02em" }}>
        No data yet
      </h2>
      <p style={{ color: "var(--ink-light)", marginBottom: 28, maxWidth: 340, margin: "0 auto 28px", lineHeight: 1.7, fontSize: 14 }}>
        Upload OLI Torus CSV exports to see learner analytics across your sites.
      </p>
      <button onClick={onUpload} style={{
        background: "var(--ink)", color: "#fff",
        border: "none", padding: "10px 28px",
        borderRadius: 8, fontWeight: 600, fontSize: 14,
        cursor: "pointer", letterSpacing: "0.01em",
        transition: "opacity 0.15s",
      }}>
        Add Data
      </button>
    </div>
  );
}
