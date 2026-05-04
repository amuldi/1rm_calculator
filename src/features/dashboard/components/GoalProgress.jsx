import React from "react";
import { motion } from "framer-motion";
import { Target, CheckCircle2 } from "lucide-react";
import { EXERCISES } from "@/constants/exercises";
import { clamp, getDisplayWeightFromKg, getGoalKg, getRecordRMKg } from "@/lib/utils";

export function GoalProgress({ goals, prMap, unit }) {
  const items = EXERCISES.filter((ex) => goals[ex.id] != null).map((ex) => {
    const goalKg = getGoalKg(goals[ex.id]);
    const currentKg = prMap[ex.id] ? getRecordRMKg(prMap[ex.id]) : 0;
    const pct = goalKg ? clamp(Math.round((currentKg / goalKg) * 100), 0, 100) : 0;
    return {
      ...ex,
      goal: getDisplayWeightFromKg(goalKg, unit),
      current: getDisplayWeightFromKg(currentKg, unit),
      pct,
    };
  });

  if (!items.length) return null;

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center gap-2">
        <Target size={15} style={{ color: "var(--accent)" }} />
        <span className="section-label">목표 달성률</span>
      </div>

      <div className="px-5 pb-5 space-y-4">
        {items.map((ex, i) => {
          const done = ex.pct >= 100;
          return (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.07 }}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black shrink-0"
                    style={{ background: "var(--accent-faint)", color: "var(--accent)" }}
                  >
                    {ex.abbr}
                  </div>
                  <span className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>{ex.labelKo}</span>
                  {done && <CheckCircle2 size={13} style={{ color: "var(--accent)" }} />}
                </div>
                <div className="text-right shrink-0">
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: done ? "var(--accent)" : "var(--text-1)" }}
                  >
                    {ex.pct}%
                  </span>
                  <span className="text-xs ml-1.5" style={{ color: "var(--text-2)" }}>
                    {ex.current} / {ex.goal} {unit}
                  </span>
                </div>
              </div>

              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--muted-fill)" }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ex.pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 + 0.2, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: done
                      ? "var(--accent)"
                      : "linear-gradient(to right, var(--accent), rgba(244,189,80,0.65))",
                    boxShadow: done ? "0 0 8px var(--accent-glow)" : "none",
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
