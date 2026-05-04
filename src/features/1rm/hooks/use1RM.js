import { useState, useCallback, useMemo } from "react";
import { useWorkoutStore } from "@/store/workoutStore";
import { useGoalStore } from "@/store/goalStore";
import { useUIStore } from "@/store/uiStore";
import { calculate1RM, calculateAll1RM } from "../utils/formulas";
import { convertWeight, getDisplayWeightFromKg, getRecordRMKg } from "@/lib/utils";

function validate(exerciseId, weight, reps) {
  const errs = {};
  if (!exerciseId) errs.exercise = "운동 종목을 선택하세요.";
  const w = parseFloat(weight);
  if (!weight || isNaN(w) || w <= 0) errs.weight = "유효한 무게를 입력하세요.";
  else if (w > 500) errs.weight = "500 이하의 무게를 입력하세요.";
  const r = parseInt(reps, 10);
  if (!reps || isNaN(r)) errs.reps = "반복 횟수를 입력하세요.";
  else if (r < 1 || r > 30) errs.reps = "1 ~ 30 사이 값을 입력하세요.";
  return errs;
}

export function use1RM() {
  const [exerciseId, setExerciseId] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [resultKg, setResultKg] = useState(null);
  const [allResultsKg, setAllResultsKg] = useState(null);
  const [resultMeta, setResultMeta] = useState(null);
  const [errors, setErrors] = useState({});

  const { unit, selectedFormula, setFormula } = useUIStore();
  const { addRecord, history } = useWorkoutStore();
  const { getGoal, getProgress } = useGoalStore();

  const display = useCallback(
    (valueKg) => getDisplayWeightFromKg(valueKg, unit),
    [unit]
  );

  const result = useMemo(
    () => (resultKg == null ? null : display(resultKg)),
    [display, resultKg]
  );

  const allResults = useMemo(
    () => allResultsKg?.map((formula) => ({ ...formula, value: display(formula.value) })) ?? null,
    [allResultsKg, display]
  );

  const currentGoal = useMemo(() => getGoal(exerciseId, unit), [exerciseId, getGoal, unit]);

  const currentPR = useMemo(() => {
    if (!exerciseId) return null;
    const records = history.filter((r) => r.exerciseId === exerciseId);
    if (!records.length) return null;
    return records.reduce(
      (max, record) => (getRecordRMKg(record) > getRecordRMKg(max) ? record : max),
      records[0]
    );
  }, [exerciseId, history]);

  const goalProgress = useMemo(
    () => getProgress(exerciseId, currentPR ? getRecordRMKg(currentPR) : null),
    [exerciseId, currentPR, getProgress]
  );

  const calculate = useCallback(() => {
    const errs = validate(exerciseId, weight, reps);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});

    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    const weightKg = unit === "lb" ? convertWeight(w, "lb", "kg") : w;

    const rmKg = calculate1RM(weightKg, r, selectedFormula);
    const allKg = calculateAll1RM(weightKg, r);
    const previous = history.filter((record) => record.exerciseId === exerciseId);
    const previousBestKg = previous.length
      ? Math.max(...previous.map((record) => getRecordRMKg(record)))
      : null;
    const isPR = previousBestKg == null || rmKg >= previousBestKg;

    const record = addRecord({
      exerciseId,
      weight: w,
      weightKg,
      reps: r,
      rm: display(rmKg),
      rmKg,
      unit,
      formula: selectedFormula,
      date: new Date().toISOString(),
    });

    setResultKg(rmKg);
    setAllResultsKg(allKg);
    setResultMeta({ recordId: record.id, isPR });
  }, [addRecord, display, exerciseId, history, reps, selectedFormula, unit, weight]);

  const reset = useCallback(() => {
    setResultKg(null);
    setAllResultsKg(null);
    setResultMeta(null);
    setErrors({});
  }, []);

  return {
    exerciseId, setExerciseId,
    weight, setWeight,
    reps, setReps,
    result, allResults,
    errors,
    unit, selectedFormula, setFormula,
    currentGoal, currentPR, goalProgress,
    isPR: Boolean(resultMeta?.isPR),
    calculate, reset,
  };
}
