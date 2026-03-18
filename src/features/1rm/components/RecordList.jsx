import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Trash2, Trophy, Clock } from "lucide-react";
import { useWorkoutStore } from "@/store/workoutStore";
import { EXERCISES, FILTER_OPTIONS } from "@/constants/exercises";
import { formatDate } from "@/lib/utils";

export function RecordList() {
  const { history, deleteRecord, getPRByExercise } = useWorkoutStore();
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("all");

  const prMap = useMemo(() => getPRByExercise(), [history]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return history.filter((r) => {
      const d = new Date(r.date).getTime();
      if (filter === "week")  return now - d <= 7 * 86400000;
      if (filter === "month") return now - d <= 30 * 86400000;
      return true;
    });
  }, [history, filter]);

  const grouped = useMemo(() => {
    const g = {};
    for (const r of filtered) {
      if (!g[r.exerciseId]) g[r.exerciseId] = [];
      g[r.exerciseId].push(r);
    }
    return g;
  }, [filtered]);

  if (!history.length) return null;

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: "var(--text-2)" }} />
          <span className="section-label">기록 목록</span>
        </div>
        <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all"
              style={{
                background: filter === opt.value ? "rgba(255,255,255,0.12)" : "transparent",
                color:      filter === opt.value ? "var(--text-1)" : "var(--text-3)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {!Object.keys(grouped).length ? (
        <p className="text-sm text-center py-8" style={{ color: "var(--text-2)" }}>
          해당 기간에 기록이 없습니다.
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
          {EXERCISES.filter((ex) => grouped[ex.id]).map((ex) => {
            const records = grouped[ex.id];
            const pr = prMap[ex.id];
            const isOpen = expanded === ex.id;

            return (
              <div key={ex.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : ex.id)}
                  className="w-full flex items-center justify-between px-5 py-3.5 transition-colors"
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
                    <div className="text-left">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{ex.label}</p>
                      <p className="text-xs" style={{ color: "var(--text-2)" }}>{records.length}개 기록</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {pr && (
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Trophy size={11} style={{ color: "var(--accent)" }} />
                          <span className="text-sm font-black tabular-nums" style={{ color: "var(--accent)" }}>
                            {pr.rm} {pr.unit}
                          </span>
                        </div>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-2)" }}>최고 기록</p>
                      </div>
                    )}
                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      style={{ color: "var(--text-3)" }}
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                      style={{ borderTop: "1px solid var(--border-subtle)" }}
                    >
                      <div className="p-3 space-y-1.5 max-h-72 overflow-y-auto scrollbar-none">
                        {records.map((r) => {
                          const isPR = pr?.id === r.id;
                          return (
                            <motion.div
                              key={r.id}
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0, x: -16 }}
                              className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
                              style={{
                                background: isPR ? "var(--accent-faint)" : "rgba(255,255,255,0.03)",
                                border: `1px solid ${isPR ? "var(--accent-border)" : "transparent"}`,
                              }}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium tabular-nums" style={{ color: "var(--text-1)" }}>
                                    {r.weight}{r.unit} × {r.reps}회
                                  </span>
                                  <span style={{ color: "var(--text-3)" }}>→</span>
                                  <span className="font-bold tabular-nums" style={{ color: isPR ? "var(--accent)" : "var(--text-1)" }}>
                                    {r.rm}{r.unit}
                                  </span>
                                  {isPR && <span className="badge-accent text-[9px]">PR</span>}
                                </div>
                                <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                                  {formatDate(r.date)} · {r.formula}
                                </p>
                              </div>
                              <button
                                onClick={() => deleteRecord(r.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0"
                                style={{ color: "var(--text-3)" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.background = "var(--red-faint)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
