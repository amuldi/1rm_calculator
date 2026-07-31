import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";

const ACCENT = "#F4BD50";

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-4 py-3 shadow-xl"
      style={{
        background: "var(--card)",
        border: "1px solid var(--accent-border)",
        borderRadius: "8px",
      }}
    >
      <p className="text-xs mb-1" style={{ color: "var(--text-2)" }}>{payload[0]?.payload?.dateLabel}</p>
      <p className="text-sm font-bold tabular-nums" style={{ color: ACCENT }}>
        {payload[0].value?.toLocaleString()} kcal
      </p>
      <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>
        단백질 {payload[0]?.payload?.protein?.toLocaleString()}g
      </p>
    </div>
  );
};

export function NutritionTrendChart({ data, calorieTarget }) {
  const chartData = [...data]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      ...d,
      dateLabel: format(parseISO(d.date), "M/d"),
      kcal: Math.round(d.kcal),
      protein: Math.round(d.protein),
    }));

  const avgKcal = Math.round(chartData.reduce((sum, d) => sum + d.kcal, 0) / (chartData.length || 1));

  return (
    <div className="card p-5">
      <div className="mb-4">
        <p className="section-label mb-1">주간 영양 섭취 추이</p>
        <p className="text-3xl font-black tabular-nums" style={{ color: "var(--text-1)" }}>
          {avgKcal.toLocaleString()}
          <span className="text-base font-semibold ml-1.5" style={{ color: "var(--text-2)" }}>kcal/일 평균</span>
        </p>
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="ng" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.25} />
                <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: "var(--text-3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "var(--text-3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip content={<Tip />} cursor={{ stroke: "var(--chart-cursor)", strokeWidth: 1 }} />
            {calorieTarget > 0 && (
              <ReferenceLine y={calorieTarget} stroke="var(--accent)" strokeDasharray="4 4" strokeOpacity={0.6} />
            )}
            <Area
              type="monotone"
              dataKey="kcal"
              stroke={ACCENT}
              strokeWidth={2}
              fill="url(#ng)"
              dot={false}
              activeDot={{ r: 4, fill: ACCENT, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
