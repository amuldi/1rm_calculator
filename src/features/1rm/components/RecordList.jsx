import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Pencil, Trash2, Trophy, Clock, X } from "lucide-react";
import { useWorkoutStore } from "@/store/workoutStore";
import { useUIStore } from "@/store/uiStore";
import { EXERCISES, FILTER_OPTIONS } from "@/constants/exercises";
import { convertWeight, dateInputToISO, formatDate, getRecordDisplay, toDateInputValue } from "@/lib/utils";
import { calculate1RM } from "../utils/formulas";

export function RecordList() {
  const { history, deleteRecord, updateRecord, getPRByExercise } = useWorkoutStore();
  const { unit } = useUIStore();
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const prMap = useMemo(() => getPRByExercise(), [getPRByExercise, history]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return history.filter((r) => {
      const d = new Date(r.date).getTime();
      if (filter === "week") return now - d <= 7 * 86400000;
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

  const startEdit = (record) => {
    const display = getRecordDisplay(record, unit);
    setEditingId(record.id);
    setDraft({
      weight: String(display.weight || ""),
      reps: String(display.reps || ""),
      sets: String(display.sets || 1),
      rpe: display.rpe ? String(display.rpe) : "",
      notes: display.notes || "",
      date: toDateInputValue(display.date),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = (record) => {
    if (!draft) return;
    const weight = parseFloat(draft.weight);
    const reps = parseInt(draft.reps, 10);
    const sets = parseInt(draft.sets, 10);
    const rpe = draft.rpe ? parseFloat(draft.rpe) : null;
    if (!weight || !reps || reps < 1 || reps > 15 || !sets || sets < 1 || sets > 20) return;
    if (rpe != null && (Number.isNaN(rpe) || rpe < 1 || rpe > 10)) return;

    const weightKg = unit === "lb" ? convertWeight(weight, "lb", "kg") : weight;
    const rmKg = calculate1RM(weightKg, reps, record.formula);
    updateRecord(record.id, {
      weight,
      weightKg,
      reps,
      sets,
      rpe,
      notes: draft.notes,
      date: dateInputToISO(draft.date),
      rm: unit === "lb" ? convertWeight(rmKg, "kg", "lb") : rmKg,
      rmKg,
      unit,
    });
    cancelEdit();
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: "var(--text-2)" }} />
          <span className="section-label">기록 목록</span>
        </div>
        <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: "var(--control-bg)" }}>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all"
              style={{
                background: filter === opt.value ? "var(--control-active)" : "transparent",
                color: filter === opt.value ? "var(--text-1)" : "var(--text-3)",
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
            const prDisplay = pr ? getRecordDisplay(pr, unit) : null;
            const isOpen = expanded === ex.id;

            return (
              <div key={ex.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : ex.id)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-3.5 transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--control-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                      style={{ background: "var(--accent-faint)", color: "var(--accent)" }}
                    >
                      {ex.abbr}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{ex.labelKo}</p>
                      <p className="text-xs" style={{ color: "var(--text-2)" }}>{records.length}개 기록</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {prDisplay && (
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Trophy size={11} style={{ color: "var(--gold)" }} />
                          <span className="text-sm font-black tabular-nums" style={{ color: "var(--gold)" }}>
                            {prDisplay.rm} {unit}
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
                        {records.map((record) => {
                          const r = getRecordDisplay(record, unit);
                          const isPR = pr?.id === r.id;
                          const isEditing = editingId === r.id;
                          return (
                            <motion.div
                              key={r.id}
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0, x: -16 }}
                              className="px-4 py-3 rounded-lg transition-colors"
                              style={{
                                background: isPR ? "var(--accent-faint)" : "var(--row-bg)",
                                border: `1px solid ${isPR ? "var(--accent-border)" : "transparent"}`,
                              }}
                            >
                              {isEditing ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      value={draft?.weight ?? ""}
                                      onChange={(e) => setDraft((current) => ({ ...(current || {}), weight: e.target.value }))}
                                      className="field text-sm"
                                      aria-label="수정할 무게"
                                    />
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      value={draft?.reps ?? ""}
                                      onChange={(e) => setDraft((current) => ({ ...(current || {}), reps: e.target.value }))}
                                      className="field text-sm"
                                      aria-label="수정할 반복 횟수"
                                    />
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      value={draft?.sets ?? ""}
                                      onChange={(e) => setDraft((current) => ({ ...(current || {}), sets: e.target.value }))}
                                      className="field text-sm"
                                      aria-label="수정할 세트 수"
                                    />
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      value={draft?.rpe ?? ""}
                                      onChange={(e) => setDraft((current) => ({ ...(current || {}), rpe: e.target.value }))}
                                      className="field text-sm"
                                      placeholder="RPE"
                                      aria-label="수정할 RPE"
                                    />
                                    <input
                                      type="date"
                                      value={draft?.date ?? ""}
                                      onChange={(e) => setDraft((current) => ({ ...(current || {}), date: e.target.value }))}
                                      className="field text-sm"
                                      aria-label="수정할 날짜"
                                    />
                                  </div>
                                  <textarea
                                    value={draft?.notes ?? ""}
                                    onChange={(e) => setDraft((current) => ({ ...(current || {}), notes: e.target.value.slice(0, 160) }))}
                                    rows={2}
                                    className="field resize-none text-sm"
                                    placeholder="메모"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button onClick={cancelEdit} className="btn-ghost px-3 py-2 text-xs">
                                      <X size={13} />
                                      취소
                                    </button>
                                    <button onClick={() => saveEdit(record)} className="btn-accent px-3 py-2 text-xs">
                                      <Check size={13} />
                                      저장
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-3">
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-2 text-sm flex-wrap">
                                      <span className="font-medium tabular-nums" style={{ color: "var(--text-1)" }}>
                                        {r.weight}{unit} × {r.reps}회 × {r.sets || 1}세트
                                      </span>
                                      <span style={{ color: "var(--text-3)" }}>→</span>
                                      <span className="font-bold tabular-nums" style={{ color: isPR ? "var(--accent)" : "var(--text-1)" }}>
                                        {r.rm}{unit}
                                      </span>
                                      {isPR && <span className="badge-accent text-[9px]">PR</span>}
                                    </div>
                                    <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                                      {formatDate(r.date)} · {r.formula}
                                      {r.rpe ? ` · RPE ${r.rpe}` : ""}
                                    </p>
                                    {r.notes && (
                                      <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>
                                        {r.notes}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => startEdit(record)}
                                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                      style={{ color: "var(--text-3)" }}
                                      aria-label="기록 수정"
                                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-faint)"; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    <button
                                      onClick={() => deleteRecord(r.id)}
                                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                      style={{ color: "var(--text-3)" }}
                                      aria-label="기록 삭제"
                                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.background = "var(--red-faint)"; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              )}
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
