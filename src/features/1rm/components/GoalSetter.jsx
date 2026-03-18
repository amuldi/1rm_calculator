import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Trash2, CheckCircle2 } from "lucide-react";
import { useGoalStore } from "@/store/goalStore";
import { useWorkoutStore } from "@/store/workoutStore";
import { useUIStore } from "@/store/uiStore";
import { clamp } from "@/lib/utils";

export function GoalSetter({ exerciseId }) {
  const { unit } = useUIStore();
  const { goals, setGoal, deleteGoal } = useGoalStore();
  const { history } = useWorkoutStore();

  const currentGoal = exerciseId ? goals[exerciseId] : null;
  const [input, setInput] = useState(currentGoal?.toString() || "");
  const [saved, setSaved] = useState(false);

  const currentBest = useMemo(() => {
    if (!exerciseId) return null;
    const recs = history.filter((r) => r.exerciseId === exerciseId);
    if (!recs.length) return null;
    return Math.max(...recs.map((r) => r.rm));
  }, [exerciseId, history]);

  const progress = currentGoal && currentBest
    ? clamp(Math.round((currentBest / currentGoal) * 100), 0, 100)
    : 0;

  useEffect(() => {
    setInput(currentGoal?.toString() || "");
    setSaved(false);
  }, [exerciseId, currentGoal]);

  const save = () => {
    const v = parseFloat(input);
    if (!exerciseId || isNaN(v) || v <= 0) return;
    setGoal(exerciseId, v);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Target size={15} style={{ color: "var(--accent)" }} />
        <span className="section-label">목표 1RM</span>
      </div>

      {!exerciseId ? (
        <p className="text-sm" style={{ color: "var(--text-2)" }}>운동 종목을 선택하면 목표를 설정할 수 있습니다.</p>
      ) : (
        <>
          {currentGoal && currentBest && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs" style={{ color: "var(--text-2)" }}>
                <span>현재 최고 {currentBest} {unit}</span>
                <span>목표 {currentGoal} {unit} · {progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: progress >= 100 ? "var(--accent)" : "linear-gradient(to right, var(--accent), rgba(0,200,255,0.4))",
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                inputMode="decimal"
                placeholder={`목표 1RM (${unit})`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                className="field pr-12 w-full"
              />
              <span
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none"
                style={{ color: "var(--text-2)" }}
              >
                {unit}
              </span>
            </div>

            <button
              onClick={save}
              disabled={!input || isNaN(parseFloat(input))}
              className="btn-accent px-4 py-2.5 text-sm shrink-0 min-w-[88px]"
            >
              <AnimatePresence mode="wait">
                {saved ? (
                  <motion.span
                    key="ok"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} /> 저장됨
                  </motion.span>
                ) : (
                  <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    저장
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {currentGoal && (
              <button onClick={() => deleteGoal(exerciseId)} className="btn-danger w-10 h-10 p-0 shrink-0">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
