function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="6"/>
      <path d="M7 6.5v3.5"/>
      <circle cx="7" cy="4.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function Tooltip({ text, hero, align = "center" }) {
  const horizStyle =
    align === "left"  ? { left: 0 } :
    align === "right" ? { right: 0 } :
                        { left: "50%", transform: "translateX(-50%)" };

  const arrowLeft =
    align === "left"  ? 16 :
    align === "right" ? "auto" : "50%";
  const arrowRight = align === "right" ? 16 : "auto";
  const arrowTransform = align === "center" ? "translateX(-50%)" : "none";

  return (
    <div style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={(e) => {
        const tt = e.currentTarget.querySelector(".stat-tip");
        if (tt) tt.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        const tt = e.currentTarget.querySelector(".stat-tip");
        if (tt) tt.style.opacity = "0";
      }}
    >
      <span style={{ color: hero ? "rgba(255,255,255,0.35)" : "var(--ink-light)", cursor: "default", display: "flex" }}>
        <InfoIcon />
      </span>
      <div className="stat-tip" style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        ...horizStyle,
        background: "#1A1A1A",
        color: "#fff",
        fontSize: 12,
        fontWeight: 400,
        lineHeight: 1.6,
        padding: "8px 12px",
        borderRadius: 8,
        width: 220,
        pointerEvents: "none",
        zIndex: 300,
        opacity: 0,
        transition: "opacity 0.15s",
        boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
      }}>
        {text}
        <span style={{
          position: "absolute",
          top: "100%",
          left: arrowLeft,
          right: arrowRight,
          transform: arrowTransform,
          borderWidth: 5,
          borderStyle: "solid",
          borderColor: "#1A1A1A transparent transparent transparent",
        }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, hero = false, accent = false, tip, tipAlign }) {
  return (
    <div style={{
      background: hero ? "#16213E" : "var(--card)",
      borderRadius: 14,
      padding: "22px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      border: hero ? "none" : "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: hero ? "rgba(255,255,255,0.45)" : "var(--ink-light)",
        }}>{label}</span>
        {tip && <Tooltip text={tip} hero={hero} align={tipAlign} />}
      </div>
      <span style={{
        fontSize: "var(--num-lg)",
        fontWeight: 700,
        color: accent ? "#2A4A7F" : hero ? "#fff" : "var(--ink)",
        lineHeight: 1,
        letterSpacing: "-0.03em",
        fontVariantNumeric: "tabular-nums",
      }}>{value}</span>
      {sub && (
        <span style={{
          fontSize: 12,
          color: hero ? "rgba(255,255,255,0.45)" : "var(--ink-light)",
          fontWeight: 400,
          marginTop: 2,
        }}>{sub}</span>
      )}
    </div>
  );
}

function MiniCard({ label, value, sub, tip, tipAlign }) {
  return (
    <div style={{
      background: "var(--card)",
      borderRadius: 14,
      padding: "20px 24px",
      border: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      gap: 5,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-light)" }}>{label}</span>
        {tip && <Tooltip text={tip} align={tipAlign} />}
      </div>
      <span style={{ fontSize: "var(--num-md)", fontWeight: 700, color: "var(--ink)", lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: "var(--ink-light)", fontWeight: 400 }}>{sub}</span>}
    </div>
  );
}

export default function Summary({ analytics }) {
  const {
    total_enrolled, total_completed, pct_completed,
    total_active, avg_high_proficiency, avg_medium_proficiency,
    total_not_enough_data, site_count,
  } = analytics;

  return (
    <div>
      <div style={{
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--ink-light)",
        marginBottom: 16,
      }}>
        Aggregated across {site_count} sites
      </div>

      <div className="stat-grid">
        <StatCard
          hero
          label="Total Enrolled"
          value={total_enrolled.toLocaleString()}
          sub={`across ${site_count} sites`}
          tip="Total number of learners registered across all learning sites."
          tipAlign="left"
        />
        <StatCard
          accent
          label="Completion Rate"
          value={`${pct_completed}%`}
          sub={`${total_completed.toLocaleString()} at 100%`}
          tip="Percentage of learners who reached 100% progress in their course."
          tipAlign="center"
        />
        <StatCard
          label="Active Learners"
          value={total_active.toLocaleString()}
          sub="with interactions"
          tip="Learners who have at least one recorded interaction in OLI Torus."
          tipAlign="center"
        />
        <StatCard
          label="Insufficient Data"
          value={total_not_enough_data.toLocaleString()}
          sub="need more activity"
          tip="Learners without enough activity for OLI Torus to assess their proficiency level."
          tipAlign="right"
        />
      </div>

      <div className="mini-grid">
        <MiniCard
          label="Avg. High Proficiency / Site"
          value={avg_high_proficiency}
          sub="learners per site at high mastery"
          tip="Average number of learners per site rated at High proficiency by OLI Torus."
          tipAlign="left"
        />
        <MiniCard
          label="Avg. Medium Proficiency / Site"
          value={avg_medium_proficiency}
          sub="learners per site at medium mastery"
          tip="Average number of learners per site rated at Medium proficiency by OLI Torus."
          tipAlign="right"
        />
      </div>
    </div>
  );
}
