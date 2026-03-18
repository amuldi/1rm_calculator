import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { getPercentages } from "../utils/formulas";
import { useUIStore } from "@/store/uiStore";

export function ResultCard({ result, allResults, isPR, goalProgress, currentGoal }) {
  const [showTable, setShowTable] = useState(false);
  const { unit } = useUIStore();

  if (result == null) return null;

  const percentages = getPercentages(result);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="space-y-3"
    >
      {/* Main result */}
      <div className={isPR ? "card-accent p-6 text-center space-y-4" : "card p-6 text-center space-y-4"}>
        {isPR && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-accent"
          >
            <Trophy size={12} />
            개인 최고 기록 갱신!
          </motion.div>
        )}

        <div>
          <p className="section-label mb-2">예상 1RM</p>
          <motion.div
            key={result}
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`text-7xl font-black tracking-tight leading-none ${isPR ? "gradient-text" : ""}`}
            style={isPR ? {} : { color: "var(--text-1)" }}
          >
            {result}
          </motion.div>
          <p className="text-xl font-semibold mt-1" style={{ color: "var(--text-2)" }}>{unit}</p>
        </div>

        {currentGoal && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs" style={{ color: "var(--text-2)" }}>
              <span>현재</span>
              <span>목표 {currentGoal} {unit} · {goalProgress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goalProgress}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: goalProgress >= 100 ? "var(--accent)" : "linear-gradient(to right, var(--accent), rgba(0,200,255,0.4))",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Formula comparison */}
      {allResults && (
        <div className="card p-5 space-y-3">
          <p className="section-label">공식별 비교</p>
          <div className="space-y-2.5">
            {allResults.map((f) => {
              const pct = Math.round((f.value / Math.max(...allResults.map((x) => x.value))) * 100);
              return (
                <div key={f.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{f.label}</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-1)" }}>
                      {f.value} <span className="text-xs font-normal" style={{ color: "var(--text-2)" }}>{unit}</span>
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: "var(--accent)", opacity: 0.5 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Training zones */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setShowTable((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 transition-colors"
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: "var(--accent)" }} />
            <span className="section-label">트레이닝 존</span>
          </div>
          {showTable
            ? <ChevronUp size={15} style={{ color: "var(--text-2)" }} />
            : <ChevronDown size={15} style={{ color: "var(--text-2)" }} />
          }
        </button>

        <AnimatePresence>
          {showTable && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-1.5">
                {percentages.map((row) => (
                  <div
                    key={row.pct}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold w-8 tabular-nums" style={{ color: "var(--text-2)" }}>
                        {row.pct}%
                      </span>
                      <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${row.pct}%`, background: "var(--accent)", opacity: 0.6 }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-1)" }}>
                        {row.weight} {unit}
                      </span>
                      <span className="text-xs ml-2" style={{ color: "var(--text-2)" }}>
                        ~{row.reps}회
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
