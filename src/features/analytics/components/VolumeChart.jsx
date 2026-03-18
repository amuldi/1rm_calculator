import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";

const ACCENT = "#00C8FF";

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-4 py-3 shadow-xl"
      style={{
        background: "var(--card)",
        border: "1px solid var(--accent-border)",
        borderRadius: "12px",
      }}
    >
      <p className="text-xs mb-1" style={{ color: "var(--text-2)" }}>{payload[0]?.payload?.dateLabel}</p>
      <p className="text-sm font-bold tabular-nums" style={{ color: ACCENT }}>
        {payload[0].value?.toLocaleString()} {payload[0]?.payload?.unit}
      </p>
    </div>
  );
};

export function VolumeChart({ data, unit }) {
  const chartData = data.map((d) => ({
    ...d,
    dateLabel: format(parseISO(d.date), "M/d"),
    unit,
  }));

  const total = data.reduce((s, d) => s + d.volume, 0);

  return (
    <div className="card p-5">
      <div className="mb-4">
        <p className="section-label mb-1">훈련 볼륨 추이</p>
        <p className="text-3xl font-black tabular-nums" style={{ color: "var(--text-1)" }}>
          {total.toLocaleString()}
          <span className="text-base font-semibold ml-1.5" style={{ color: "var(--text-2)" }}>{unit}</span>
        </p>
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.25} />
                <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
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
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<Tip />} cursor={{ stroke: "rgba(0,200,255,0.15)", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="volume"
              stroke={ACCENT}
              strokeWidth={2}
              fill="url(#vg)"
              dot={false}
              activeDot={{ r: 4, fill: ACCENT, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
