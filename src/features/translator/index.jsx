import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Scale, Sparkles, Repeat2 } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import {
  LIFT_OPTIONS,
  SUPPORTED_REP_RANGE,
  calculateTargetRepWeight,
  validateRepWeightInputs,
} from "./utils/repWeightEstimator";

function ExercisePicker({ value, onChange, error }) {
  return (
    <div className="space-y-2">
      <label className="label">운동 선택</label>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {LIFT_OPTIONS.map((lift) => {
          const active = value === lift.id;
          return (
            <button
              key={lift.id}
              type="button"
              onClick={() => onChange(lift.id)}
              className="rounded-2xl p-3 text-left transition-all"
              style={{
                background: active ? "var(--accent-faint)" : "var(--row-bg)",
                border: `1px solid ${active ? "var(--accent-border)" : "var(--border-subtle)"}`,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold" style={{ color: active ? "var(--accent)" : "var(--text-1)" }}>
                    {lift.labelKo}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>
                    {lift.label}
                  </p>
                </div>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black"
                  style={{
                    background: active ? "var(--accent-faint)" : "var(--control-bg)",
                    color: active ? "var(--accent)" : "var(--text-2)",
                  }}
                >
                  {lift.abbr}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs" style={{ color: "var(--red)" }}>{error}</p>}
    </div>
  );
}

function NumberField({ label, value, onChange, placeholder, suffix, error }) {
  return (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="field pr-14"
          style={error ? { borderColor: "var(--red-border)" } : {}}
        />
        <span
          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none"
          style={{ color: "var(--text-2)" }}
        >
          {suffix}
        </span>
      </div>
      {error && <p className="text-xs" style={{ color: "var(--red)" }}>{error}</p>}
    </div>
  );
}

function ResultCard({ result }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className="space-y-4"
    >
      <div className="card-soft p-6 md:p-7 text-center space-y-4">
        <div>
          <p className="section-label mb-2">예상 중량</p>
          <p className="text-6xl font-black tracking-tight leading-none" style={{ color: "var(--text-1)" }}>
            {result.estimatedWeight}
            <span className="text-3xl ml-1" style={{ color: "var(--text-2)" }}>{result.unit}</span>
          </p>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
          {result.explanation}
        </p>
      </div>

      <div className="card-soft p-5 md:p-6">
        <div className="grid sm:grid-cols-4 gap-3">
          <div>
            <p className="section-label mb-1">운동</p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{result.lift.labelKo}</p>
          </div>
          <div>
            <p className="section-label mb-1">입력 1RM</p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{result.inputOneRM} {result.unit}</p>
          </div>
          <div>
            <p className="section-label mb-1">목표 반복 횟수</p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{result.reps}회</p>
          </div>
          <div>
            <p className="section-label mb-1">1RM 대비 비율</p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{result.percentage}%</p>
          </div>
        </div>
        <p className="text-xs mt-4" style={{ color: "var(--text-2)" }}>
          적용 기준: {result.lift.profileLabel}
        </p>
      </div>
    </motion.div>
  );
}

export default function TranslatorPage() {
  const { unit } = useUIStore();
  const [exerciseId, setExerciseId] = useState("");
  const [oneRM, setOneRM] = useState("");
  const [targetReps, setTargetReps] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(
    () => (submitted ? validateRepWeightInputs({ exerciseId, oneRM, reps: targetReps }) : {}),
    [exerciseId, oneRM, targetReps, submitted]
  );

  const result = useMemo(() => {
    if (!submitted || Object.keys(errors).length) return null;
    return calculateTargetRepWeight({
      exerciseId,
      oneRM,
      reps: targetReps,
      unit,
    });
  }, [errors, exerciseId, oneRM, targetReps, unit, submitted]);

  const handleCalculate = () => {
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="card p-5 md:p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-1)" }}>목표 반복 중량 계산</h1>
              <p className="text-sm leading-relaxed mt-1" style={{ color: "var(--text-2)" }}>
                1RM과 목표 반복 횟수를 입력하면 해당 반복 수에 맞는 예상 훈련 중량을 계산합니다.
              </p>
            </div>
            <div
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{ background: "var(--row-bg)", border: "1px solid var(--border-subtle)" }}
            >
              <Scale size={15} style={{ color: "var(--accent)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>실전적인 %1RM 기반 계산</span>
            </div>
          </div>

          <ExercisePicker value={exerciseId} onChange={setExerciseId} error={errors.exercise} />

          <div className="grid md:grid-cols-2 gap-4">
            <NumberField
              label="1RM 입력"
              value={oneRM}
              onChange={setOneRM}
              placeholder={unit === "kg" ? "130" : "285"}
              suffix={unit}
              error={errors.oneRM}
            />
            <NumberField
              label="목표 반복 횟수"
              value={targetReps}
              onChange={setTargetReps}
              placeholder="8"
              suffix="회"
              error={errors.reps}
            />
          </div>

          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--row-bg)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Repeat2 size={15} style={{ color: "var(--accent)" }} />
              <p className="section-label">안내</p>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
              {SUPPORTED_REP_RANGE.min}~{SUPPORTED_REP_RANGE.max}회 범위에서 계산합니다. 벤치, 오버헤드프레스, 바벨로우, 스쿼트, 데드리프트는 각각 다른 반복 비율 테이블을 사용합니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
              입력한 1RM 기준으로 목표 반복 횟수에 해당하는 예상 중량입니다.
            </p>
            <button type="button" onClick={handleCalculate} className="btn-accent px-5 py-3 text-sm">
              <Sparkles size={16} />
              예상 중량 계산하기
            </button>
          </div>
        </div>

        {!submitted && (
          <div className="card-soft p-5 md:p-6">
            <p className="text-base font-semibold" style={{ color: "var(--text-1)" }}>운동과 목표 반복 횟수를 입력해 주세요</p>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-2)" }}>
              예: 벤치프레스 1RM 130kg, 목표 8회 → 약 105kg
            </p>
          </div>
        )}

        {result && <ResultCard result={result} />}
      </div>
    </div>
  );
}
