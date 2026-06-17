import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const SLICES = [
  { key: "high_proficiency",   label: "High",            color: "#16213E" },
  { key: "medium_proficiency", label: "Medium",          color: "#2A4A7F" },
  { key: "low_proficiency",    label: "Low",             color: "#7BAFD4" },
  { key: "not_enough_data",    label: "Not Enough Data", color: "#C2D8EE" },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "var(--ink)", color: "#fff",
      padding: "7px 12px", borderRadius: 8,
      fontFamily: "var(--font-sans)", fontSize: 13,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    }}>
      <span style={{ fontWeight: 600 }}>{d.label}: </span>
      {d.value.toLocaleString()} ({d.pct}%)
    </div>
  );
};

export default function ProficiencyChart({ sites }) {
  const totals = sites.reduce((acc, s) => {
    SLICES.forEach(({ key }) => { acc[key] = (acc[key] || 0) + s[key]; });
    return acc;
  }, {});

  const total = SLICES.reduce((s, { key }) => s + (totals[key] || 0), 0);
  const data = SLICES
    .map(({ key, label, color }) => ({
      key, label, color,
      value: totals[key] || 0,
      pct: total ? Math.round((totals[key] || 0) / total * 100) : 0,
    }))
    .filter((d) => d.value > 0);

  return (
    <div style={{
      background: "var(--card)",
      borderRadius: 14,
      padding: "22px 24px",
      border: "1px solid var(--border)",
    }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 4 }}>
          Proficiency Distribution
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>
          {total.toLocaleString()} learners
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data} cx="50%" cy="50%"
            innerRadius={56} outerRadius={84}
            dataKey="value" paddingAngle={2}
            startAngle={90} endAngle={-270}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="var(--card)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
        {data.map((d) => (
          <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, color: "var(--ink-mid)", fontWeight: 400 }}>{d.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{d.value.toLocaleString()}</span>
            <span style={{ fontSize: 12, color: "var(--ink-light)", width: 36, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
