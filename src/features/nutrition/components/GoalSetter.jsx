import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Trash2, CheckCircle2, Sparkles } from "lucide-react";
import { useNutritionStore } from "@/store/nutritionStore";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Field } from "@/components/common/Field";
import { GOAL_MODES, ACTIVITY_LEVELS, DEFAULT_ACTIVITY_LEVEL, DEFAULT_GOAL_MODE, getMacroTargets } from "../utils/nutritionMath";

export function GoalSetter() {
  const { goal, setGoal, clearGoal } = useNutritionStore();
  const [weightKg, setWeightKg] = useState(goal?.weightKg ? String(goal.weightKg) : "");
  const [heightCm, setHeightCm] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [activityLevel, setActivityLevel] = useState(DEFAULT_ACTIVITY_LEVEL);
  const [mode, setMode] = useState(goal?.mode || DEFAULT_GOAL_MODE);
  const [saved, setSaved] = useState(false);

  const preview = useMemo(() => {
    const w = parseFloat(weightKg);
    if (!w || w <= 0) return null;
    return getMacroTargets({
      weightKg: w,
      heightCm: heightCm ? parseFloat(heightCm) : undefined,
      age: age ? parseFloat(age) : undefined,
      gender,
      activityLevel,
      goalMode: mode,
    });
  }, [activityLevel, age, gender, heightCm, mode, weightKg]);

  const save = () => {
    if (!preview?.calorieTarget || !preview?.proteinTarget) return;
    setGoal({
      calorieTarget: preview.calorieTarget,
      proteinTarget: preview.proteinTarget,
      carbsTarget: preview.carbsTarget,
      fatTarget: preview.fatTarget,
      mode,
      weightKg: parseFloat(weightKg),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Target size={15} style={{ color: "var(--accent)" }} />
        <span className="section-label">영양 목표 설정</span>
      </div>

      {goal && (
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--accent-faint)", border: "1px solid var(--accent-border)" }}>
          <p className="text-sm" style={{ color: "var(--text-1)" }}>
            현재 목표 {goal.calorieTarget}kcal · 단백질 {goal.proteinTarget}g
          </p>
          <button onClick={clearGoal} className="btn-danger w-9 h-9 p-0 shrink-0" aria-label="목표 삭제">
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="label">목표 모드</label>
        <div className="grid grid-cols-3 gap-2">
          {GOAL_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className="px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-center"
              style={{
                background: mode === m.id ? "var(--accent)" : "var(--control-bg)",
                color: mode === m.id ? "var(--text-on-accent)" : "var(--text-2)",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: "var(--text-2)" }}>
          {GOAL_MODES.find((m) => m.id === mode)?.description}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="체중 (kg)" type="number" inputMode="decimal" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="70" />
        <Field label="키 (cm)" type="number" inputMode="decimal" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="175" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="나이" type="number" inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" />
        <div className="space-y-1.5">
          <label className="label">성별</label>
          <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: "var(--control-bg)" }}>
            {[{ id: "male", label: "남성" }, { id: "female", label: "여성" }].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGender(g.id)}
                className="flex-1 py-2 rounded-md text-xs font-bold transition-all"
                style={{
                  background: gender === g.id ? "var(--accent)" : "transparent",
                  color: gender === g.id ? "var(--text-on-accent)" : "var(--text-2)",
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="label">활동 수준</label>
        <select
          value={activityLevel}
          onChange={(e) => setActivityLevel(e.target.value)}
          className="field"
          aria-label="활동 수준 선택"
        >
          {ACTIVITY_LEVELS.map((level) => (
            <option key={level.id} value={level.id}>{level.label}</option>
          ))}
        </select>
      </div>

      {preview?.calorieTarget && (
        <div className="rounded-lg px-4 py-3" style={{ background: "var(--row-bg)", border: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} style={{ color: "var(--accent)" }} />
            <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>자동 계산 결과</p>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
            기초대사량 {preview.bmr}kcal · 활동대사량 {preview.tdee}kcal
          </p>
          <p className="text-sm font-black tabular-nums mt-1.5" style={{ color: "var(--text-1)" }}>
            {preview.calorieTarget}kcal <span className="text-xs font-normal" style={{ color: "var(--text-2)" }}>목표 칼로리</span>
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-2)" }}>
            단백질 {preview.proteinTarget}g · 탄수화물 {preview.carbsTarget}g · 지방 {preview.fatTarget}g
          </p>
        </div>
      )}

      <Button variant="accent" size="lg" onClick={save} disabled={!preview?.calorieTarget} className="w-full">
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.span key="ok" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
              <CheckCircle2 size={14} /> 저장됨
            </motion.span>
          ) : (
            <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              목표로 저장
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </Card>
  );
}
