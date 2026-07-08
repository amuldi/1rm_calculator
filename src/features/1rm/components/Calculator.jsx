import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Zap, Info } from "lucide-react";
import { EXERCISES } from "@/constants/exercises";
import { getRecommendedFormula, MAX_REPS } from "../utils/formulas";
import { useUIStore } from "@/store/uiStore";

const HINTS = {
  weight: "운동 중 실제로 든 무게를 입력하세요 (바벨 포함).",
  reps:   `1~${MAX_REPS} 사이의 반복 횟수. 5회 이하에서 정확도가 높습니다.`,
};

function Dropdown({ value, onChange, options, placeholder, renderOption, renderSelected }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 field text-left"
      >
        <span style={{ color: value ? "var(--text-1)" : "var(--text-3)" }}>
          {value ? renderSelected(value) : placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-2)" }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 top-full left-0 right-0 mt-1.5 overflow-hidden shadow-2xl"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              boxShadow: "var(--shadow-menu)",
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className="w-full px-4 py-3 text-left text-sm transition-colors"
                style={{
                  background: value === opt.id ? "var(--accent-faint)" : "transparent",
                  color:      value === opt.id ? "var(--accent)" : "var(--text-1)",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
                onMouseEnter={(e) => { if (value !== opt.id) e.currentTarget.style.background = "var(--control-hover)"; }}
                onMouseLeave={(e) => { if (value !== opt.id) e.currentTarget.style.background = "transparent"; }}
              >
                {renderOption(opt)}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NumberField({ label, value, onChange, placeholder, hint, suffix, min, max, error }) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="label">{label}</label>
        {hint && (
          <button
            type="button"
            onMouseEnter={() => setShowHint(true)}
            onMouseLeave={() => setShowHint(false)}
            onTouchStart={() => setShowHint((v) => !v)}
            className="relative"
          >
            <Info size={13} style={{ color: "var(--text-3)" }} />
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-0 bottom-6 w-52 p-3 z-20 shadow-xl"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    boxShadow: "var(--shadow-menu)",
                  }}
                >
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-1)" }}>{hint}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>

      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          className="field pr-12"
          style={error ? { borderColor: "var(--red-border)" } : {}}
        />
        {suffix && (
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none select-none"
            style={{ color: "var(--text-2)" }}
          >
            {suffix}
          </span>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs"
            style={{ color: "var(--red)" }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Calculator({
  onCalculate,
  exerciseId,
  setExerciseId,
  weight,
  setWeight,
  reps,
  setReps,
  sets,
  setSets,
  rpe,
  setRpe,
  notes,
  setNotes,
  workoutDate,
  setWorkoutDate,
  errors = {},
}) {
  const { unit, setUnit } = useUIStore();
  const selectedEx = EXERCISES.find((e) => e.id === exerciseId);
  const recommendedFormula = getRecommendedFormula(exerciseId);

  return (
    <div className="card p-5 space-y-5">
      {/* Unit toggle */}
      <div className="flex items-center justify-between">
        <span className="section-label">1RM 계산기</span>
        <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: "var(--control-bg)" }}>
          {["kg", "lb"].map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className="px-3 py-1 rounded-md text-xs font-bold tracking-wider uppercase transition-all"
              style={{
                background: unit === u ? "var(--accent)" : "transparent",
                color:      unit === u ? "var(--text-on-accent)" : "var(--text-2)",
              }}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise */}
      <div className="space-y-1.5">
        <label className="label">운동 종목</label>
        <Dropdown
          value={exerciseId}
          onChange={setExerciseId}
          options={EXERCISES}
          placeholder="운동을 선택하세요"
          renderSelected={(id) => {
            const ex = EXERCISES.find((e) => e.id === id);
            return ex ? `[${ex.abbr}]  ${ex.label}` : id;
          }}
          renderOption={(ex) => (
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0"
                style={{ background: "var(--accent-faint)", color: "var(--accent)" }}
              >
                {ex.abbr}
              </div>
              <div>
                <div className="font-semibold">{ex.label}</div>
                <div className="text-xs" style={{ color: "var(--text-2)" }}>{ex.labelKo}</div>
              </div>
            </div>
          )}
        />
        {errors.exercise && (
          <p className="text-xs" style={{ color: "var(--red)" }}>{errors.exercise}</p>
        )}
      </div>

      {/* Weight + Reps */}
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="무게" value={weight} onChange={setWeight} placeholder="100" suffix={unit} min={1} max={500} hint={HINTS.weight} error={errors.weight} />
        <NumberField label="반복 횟수" value={reps} onChange={setReps} placeholder="5" suffix="회" min={1} max={MAX_REPS} hint={HINTS.reps} error={errors.reps} />
      </div>

      {/* Session detail */}
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="세트 수" value={sets} onChange={setSets} placeholder="1" suffix="세트" min={1} max={20} error={errors.sets} />
        <NumberField label="RPE" value={rpe} onChange={setRpe} placeholder="8" suffix="/10" min={1} max={10} error={errors.rpe} />
      </div>

      <div className="space-y-1.5">
        <label className="label">운동 날짜</label>
        <input
          type="date"
          value={workoutDate}
          onChange={(e) => setWorkoutDate(e.target.value)}
          className="field"
          style={errors.workoutDate ? { borderColor: "var(--red-border)" } : {}}
        />
        {errors.workoutDate && (
          <p className="text-xs" style={{ color: "var(--red)" }}>{errors.workoutDate}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="label">메모</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, 160))}
          placeholder="컨디션, 그립, 보조 장비 등을 기록하세요"
          rows={3}
          className="field resize-none"
        />
      </div>

      {/* Formula */}
      <div className="space-y-1.5">
        <label className="label">계산 공식</label>
        <div
          className="field flex items-center justify-between gap-3"
          style={{ background: "var(--row-bg)" }}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
              {exerciseId ? recommendedFormula.label : "자동 선택"}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-2)" }}>
              {exerciseId ? `${selectedEx?.labelKo} · ${recommendedFormula.description}` : "종목별 기준 적용"}
            </p>
          </div>
          <span className="badge-accent shrink-0">AUTO</span>
        </div>
      </div>

      {/* Submit */}
      <button type="button" onClick={onCalculate} className="btn-accent w-full py-3.5 text-sm">
        <Zap size={17} />
        1RM 계산하기
      </button>
    </div>
  );
}
