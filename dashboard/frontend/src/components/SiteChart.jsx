import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "var(--ink)", color: "#fff",
      padding: "8px 12px", borderRadius: 8,
      fontFamily: "var(--font-sans)", fontSize: 13,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{d.full}</div>
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{d.value}% complete</div>
    </div>
  );
};

export default function SiteChart({ sites }) {
  const top = [...sites]
    .sort((a, b) => b.pct_completed - a.pct_completed)
    .slice(0, 18);
  const data = top.map((s) => ({
    name: s.site_name.length > 20 ? s.site_name.slice(0, 18) + "…" : s.site_name,
    value: s.pct_completed,
    full: s.site_name,
  }));

  return (
    <div style={{
      background: "var(--card)",
      borderRadius: 14,
      padding: "22px 24px",
      border: "1px solid var(--border)",
    }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 4 }}>
          Completion Rate by Site
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>
          Top {data.length} sites
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 28, top: 0, bottom: 0 }}>
          <XAxis
            type="number" domain={[0, 100]}
            tick={{ fontSize: 10, fontFamily: "var(--font-sans)", fill: "#AAAAAA", fontWeight: 500 }}
            tickFormatter={(v) => `${v}%`}
            axisLine={{ stroke: "#EBEBEB" }}
            tickLine={false}
          />
          <YAxis
            type="category" dataKey="name" width={120}
            tick={{ fontSize: 11, fontFamily: "var(--font-sans)", fill: "#666666", fontWeight: 400 }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F6F6F6" }} />
          <ReferenceLine x={50} stroke="#EBEBEB" strokeDasharray="3 3" />
          <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={12} fill="var(--sidebar)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
