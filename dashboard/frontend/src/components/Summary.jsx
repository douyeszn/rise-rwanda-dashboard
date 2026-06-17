function StatCard({ label, value, sub, hero = false, accent = false }) {
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
      <span style={{
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: hero ? "rgba(255,255,255,0.45)" : "var(--ink-light)",
      }}>{label}</span>
      <span style={{
        fontSize: 40,
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

function MiniCard({ label, value, sub }) {
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
      <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-light)" }}>{label}</span>
      <span style={{ fontSize: 32, fontWeight: 700, color: "var(--ink)", lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{value}</span>
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

      {/* Primary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard
          hero
          label="Total Enrolled"
          value={total_enrolled.toLocaleString()}
          sub={`across ${site_count} sites`}
        />
        <StatCard
          label="Completion Rate"
          value={`${pct_completed}%`}
          sub={`${total_completed.toLocaleString()} at 100%`}
          accent
        />
        <StatCard
          label="Active Learners"
          value={total_active.toLocaleString()}
          sub="with interactions"
        />
        <StatCard
          label="Insufficient Data"
          value={total_not_enough_data.toLocaleString()}
          sub="need more activity"
        />
      </div>

      {/* Secondary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginTop: 14 }}>
        <MiniCard
          label="Avg. High Proficiency / Site"
          value={avg_high_proficiency}
          sub="learners per site at high mastery"
        />
        <MiniCard
          label="Avg. Medium Proficiency / Site"
          value={avg_medium_proficiency}
          sub="learners per site at medium mastery"
        />
      </div>
    </div>
  );
}
