import React, { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";
import { EXERCISES, CHART_COLORS } from "@/constants/exercises";

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-4 py-3 shadow-xl min-w-[130px]"
      style={{
        background: "var(--card)",
        border: "1px solid var(--accent-border)",
        borderRadius: "12px",
      }}
    >
      <p className="text-xs mb-2" style={{ color: "var(--text-2)" }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-xs" style={{ color: "var(--text-1)" }}>{p.name}</span>
          </div>
          <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-1)" }}>
            {p.value} {p.payload?.unit}
          </span>
        </div>
      ))}
    </div>
  );
};

export function StrengthCurve({ groupedHistory }) {
  const exercises = EXERCISES.filter((ex) => groupedHistory[ex.id]?.length > 0);
  const [active, setActive] = useState(() =>
    Object.fromEntries(exercises.map((ex) => [ex.id, true]))
  );

  const allDates = [...new Set(
    Object.values(groupedHistory).flat().map((r) => r.date?.split("T")[0])
  )].sort();

  const chartData = allDates.map((date) => {
    const point = { date, label: format(parseISO(date), "M/d") };
    for (const ex of exercises) {
      const recs = groupedHistory[ex.id]?.filter((r) => r.date?.startsWith(date)) || [];
      if (recs.length) {
        point[ex.id] = Math.max(...recs.map((r) => r.rm));
        point.unit = recs[0].unit;
      }
    }
    return point;
  });

  return (
    <div className="card p-5">
      <p className="section-label mb-3">강도 커브 (종목별 1RM)</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {exercises.map((ex, i) => (
          <button
            key={ex.id}
            onClick={() => setActive((prev) => ({ ...prev, [ex.id]: !prev[ex.id] }))}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all"
            style={
              active[ex.id]
                ? {
                    backgroundColor: `${CHART_COLORS[i % CHART_COLORS.length]}18`,
                    borderColor: CHART_COLORS[i % CHART_COLORS.length],
                    color: CHART_COLORS[i % CHART_COLORS.length],
                  }
                : { borderColor: "rgba(255,255,255,0.08)", color: "var(--text-3)" }
            }
          >
            {ex.abbr} {ex.label}
          </button>
        ))}
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "var(--text-3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<Tip />} cursor={{ stroke: "rgba(255,255,255,0.06)" }} />
            {exercises.map((ex, i) => (
              <Line
                key={ex.id}
                type="monotone"
                dataKey={ex.id}
                name={ex.label}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={active[ex.id] ? 2 : 0}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
