import { useState, useEffect, useCallback } from "react";
import Upload from "./components/Upload";
import Summary from "./components/Summary";
import SiteTable from "./components/SiteTable";
import SiteChart from "./components/SiteChart";
import ProficiencyChart from "./components/ProficiencyChart";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

export default function App() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState("overview");
  const isMobile                  = useIsMobile();

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

      {/* ── Desktop Sidebar ──────────────────────────────────────── */}
      {!isMobile && (
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 8, marginBottom: 36 }}>
            <div style={{
              width: 32, height: 32, background: "#fff", borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#16213E", letterSpacing: "-0.03em" }}>R</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: "0.04em" }}>RISE</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    width: "100%", padding: "9px 10px", paddingLeft: active ? 8 : 10,
                    borderRadius: 10, display: "flex", flexDirection: "row", alignItems: "center", gap: 10,
                    background: active ? "rgba(255,255,255,0.10)" : "transparent",
                    border: "none", borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                    color: active ? "#fff" : "rgba(255,255,255,0.4)",
                    cursor: "pointer", transition: "background 0.15s, color 0.15s, border-color 0.15s", textAlign: "left",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <Icon />
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, letterSpacing: "0.01em" }}>{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* ── Content ──────────────────────────────────────────────── */}
      <div style={{
        marginLeft: isMobile ? 0 : 160,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}>

        {/* Top bar */}
        <header style={{
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
          padding: isMobile ? "0 16px" : "0 36px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isMobile && (
              <div style={{
                width: 28, height: 28, background: "var(--sidebar)", borderRadius: 7,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: "#fff" }}>R</span>
              </div>
            )}
            <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              {TABS.find((t) => t.id === tab)?.label}
            </span>
            {tab === "overview" && hasData && !isMobile && (
              <span style={{ marginLeft: 12, fontSize: 13, color: "var(--ink-light)", fontWeight: 400 }}>
                {analytics.site_count} sites · {analytics.total_enrolled.toLocaleString()} learners
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-light)", fontWeight: 500, letterSpacing: "0.04em" }}>
            RISE RWANDA
          </div>
        </header>

        {/* Main */}
        <main style={{ flex: 1, padding: isMobile ? "20px 16px 90px" : "32px 36px 60px" }}>
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
              <div className="chart-grid">
                <SiteChart sites={analytics.sites} />
                <ProficiencyChart sites={analytics.sites} />
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────── */}
      {isMobile && (
        <nav style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          height: 64,
          background: "var(--sidebar)",
          display: "flex",
          alignItems: "stretch",
          zIndex: 100,
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  background: "transparent",
                  border: "none",
                  borderTop: active ? "2px solid var(--accent)" : "2px solid transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                  paddingBottom: 4,
                }}
              >
                <Icon />
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: "0.03em" }}>{label}</span>
              </button>
            );
          })}
        </nav>
      )}
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
