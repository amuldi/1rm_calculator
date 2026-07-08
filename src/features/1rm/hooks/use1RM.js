import { useState, useCallback, useMemo } from "react";
import { useWorkoutStore } from "@/store/workoutStore";
import { useGoalStore } from "@/store/goalStore";
import { useUIStore } from "@/store/uiStore";
import { calculate1RM, calculateAll1RM, getEstimateConfidence, getRecommendedFormula, MAX_REPS } from "../utils/formulas";
import { convertWeight, dateInputToISO, getDisplayWeightFromKg, getRecordRMKg, toDateInputValue } from "@/lib/utils";

function validate(exerciseId, weight, reps, sets, rpe, workoutDate) {
  const errs = {};
  if (!exerciseId) errs.exercise = "운동 종목을 선택하세요.";
  const w = parseFloat(weight);
  if (!weight || isNaN(w) || w <= 0) errs.weight = "유효한 무게를 입력하세요.";
  else if (w > 500) errs.weight = "500 이하의 무게를 입력하세요.";
  const r = parseInt(reps, 10);
  if (!reps || isNaN(r)) errs.reps = "반복 횟수를 입력하세요.";
  else if (r < 1 || r > MAX_REPS) errs.reps = `1 ~ ${MAX_REPS} 사이 값을 입력하세요.`;
  const s = parseInt(sets, 10);
  if (sets && (isNaN(s) || s < 1 || s > 20)) errs.sets = "세트 수는 1~20 사이로 입력하세요.";
  const effort = parseFloat(rpe);
  if (rpe && (isNaN(effort) || effort < 1 || effort > 10)) errs.rpe = "RPE는 1~10 사이로 입력하세요.";
  if (!workoutDate) errs.workoutDate = "운동 날짜를 선택하세요.";
  return errs;
}

export function use1RM() {
  const [exerciseId, setExerciseId] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("1");
  const [rpe, setRpe] = useState("");
  const [notes, setNotes] = useState("");
  const [workoutDate, setWorkoutDate] = useState(() => toDateInputValue());
  const [resultKg, setResultKg] = useState(null);
  const [allResultsKg, setAllResultsKg] = useState(null);
  const [resultMeta, setResultMeta] = useState(null);
  const [errors, setErrors] = useState({});

  const { unit } = useUIStore();
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

  const recommendedFormula = useMemo(
    () => getRecommendedFormula(exerciseId),
    [exerciseId]
  );
  const appliedFormulaId = resultMeta?.formulaId ?? recommendedFormula.id;

  const allResults = useMemo(
    () => allResultsKg?.map((formula) => ({
      ...formula,
      value: display(formula.value),
      recommended: formula.id === appliedFormulaId,
    })) ?? null,
    [allResultsKg, appliedFormulaId, display]
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
    const errs = validate(exerciseId, weight, reps, sets, rpe, workoutDate);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});

    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    const s = sets ? parseInt(sets, 10) : 1;
    const effort = rpe ? parseFloat(rpe) : null;
    const weightKg = unit === "lb" ? convertWeight(w, "lb", "kg") : w;

    const rmKg = calculate1RM(weightKg, r, recommendedFormula.id);
    const allKg = calculateAll1RM(weightKg, r);
    const confidence = getEstimateConfidence(r);
    const estimateRangeKg = {
      low: Math.max(0, rmKg * (1 - confidence.rangePct)),
      high: rmKg * (1 + confidence.rangePct),
    };
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
      sets: s,
      rpe: effort,
      notes,
      rm: display(rmKg),
      rmKg,
      unit,
      formula: recommendedFormula.id,
      date: dateInputToISO(workoutDate),
    });

    setResultKg(rmKg);
    setAllResultsKg(allKg);
    setResultMeta({
      recordId: record.id,
      isPR,
      formulaId: recommendedFormula.id,
      confidence,
      estimateRangeKg,
    });
  }, [addRecord, display, exerciseId, history, notes, recommendedFormula.id, reps, rpe, sets, unit, weight, workoutDate]);

  const reset = useCallback(() => {
    setResultKg(null);
    setAllResultsKg(null);
    setResultMeta(null);
    setErrors({});
  }, []);

  const estimateRange = useMemo(() => {
    if (!resultMeta?.estimateRangeKg) return null;
    return {
      low: display(resultMeta.estimateRangeKg.low),
      high: display(resultMeta.estimateRangeKg.high),
    };
  }, [display, resultMeta?.estimateRangeKg]);

  return {
    exerciseId, setExerciseId,
    weight, setWeight,
    reps, setReps,
    sets, setSets,
    rpe, setRpe,
    notes, setNotes,
    workoutDate, setWorkoutDate,
    result, allResults,
    errors,
    unit,
    selectedFormula: appliedFormulaId,
    recommendedFormula,
    currentGoal, currentPR, goalProgress,
    confidence: resultMeta?.confidence ?? null,
    estimateRange,
    isPR: Boolean(resultMeta?.isPR),
    calculate, reset,
  };
}
