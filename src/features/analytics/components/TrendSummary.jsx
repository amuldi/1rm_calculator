import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { EXERCISES, CHART_COLORS } from "@/constants/exercises";
import { getTrend } from "@/lib/utils";

const TREND = {
  up:     { icon: TrendingUp,   label: "상승 중", color: "#00C8FF" },
  stable: { icon: Minus,        label: "유지 중", color: "#5a7a9a" },
  down:   { icon: TrendingDown, label: "하락 중", color: "#f87171" },
};

const PieTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 shadow-xl"
      style={{
        background: "var(--card)",
        border: "1px solid var(--accent-border)",
        borderRadius: "10px",
      }}
    >
      <span className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>{payload[0].name}</span>
      <span className="text-xs ml-2" style={{ color: "var(--text-2)" }}>{payload[0].value}회</span>
    </div>
  );
};

export function TrendSummary({ groupedHistory }) {
  const exercises = EXERCISES.filter((ex) => groupedHistory[ex.id]?.length >= 1);

  const pieData = exercises.map((ex, i) => ({
    name: ex.label,
    value: groupedHistory[ex.id]?.length || 0,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-4">
      {/* Distribution donut */}
      <div className="card p-5">
        <p className="section-label mb-4">종목 분포</p>
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={40} outerRadius={56}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs truncate" style={{ color: "var(--text-1)" }}>{d.name}</span>
                </div>
                <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: "var(--text-2)" }}>
                  {d.value}회
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend per exercise */}
      <div className="card overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <p className="section-label">종목별 트렌드</p>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
          {exercises.map((ex, i) => {
            const rms = groupedHistory[ex.id].map((r) => r.rm);
            const trend = getTrend(rms);
            const { icon: Icon, label, color } = TREND[trend];
            const best = Math.max(...rms);
            const latest = rms[rms.length - 1];
            const prev = rms[Math.max(0, rms.length - 2)];
            const delta = rms.length > 1 ? latest - prev : 0;

            return (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between px-5 py-3.5 transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                    style={{ background: "var(--accent-faint)", color: "var(--accent)" }}
                  >
                    {ex.abbr}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{ex.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>
                      최고 {best} · {rms.length}회 세션
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  {delta !== 0 && rms.length > 1 && (
                    <span className="text-xs font-semibold tabular-nums"
                      style={{ color: delta > 0 ? "#00C8FF" : "#f87171" }}>
                      {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                    </span>
                  )}
                  <div
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                    style={{
                      backgroundColor: `${color}12`,
                      borderColor: `${color}30`,
                      color,
                    }}
                  >
                    <Icon size={10} />
                    {label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
