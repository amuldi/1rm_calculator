import { clamp, generateId } from "../../../lib/utils.js";

export const MEAL_TYPES = [
  { id: "breakfast", label: "아침" },
  { id: "lunch", label: "점심" },
  { id: "dinner", label: "저녁" },
  { id: "snack", label: "간식" },
];

export const GOAL_MODES = [
  { id: "bulk", label: "증량", calorieAdjustPct: 0.15, proteinPerKg: 2.0, description: "체중 증가와 근력 향상을 우선합니다" },
  { id: "maintain", label: "유지", calorieAdjustPct: 0, proteinPerKg: 1.8, description: "현재 체중과 컨디션을 유지합니다" },
  { id: "cut", label: "감량", calorieAdjustPct: -0.2, proteinPerKg: 2.2, description: "체지방 감량 중 근손실을 최소화합니다" },
];

export const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "거의 앉아서 생활", factor: 1.2 },
  { id: "light", label: "주 1~3회 운동", factor: 1.375 },
  { id: "moderate", label: "주 3~5회 운동", factor: 1.55 },
  { id: "active", label: "주 6~7회 운동", factor: 1.725 },
  { id: "veryActive", label: "매일 고강도 운동", factor: 1.9 },
];

export const DEFAULT_GOAL_MODE = "maintain";
export const DEFAULT_ACTIVITY_LEVEL = "moderate";

export function getMealTypeMeta(mealType) {
  return MEAL_TYPES.find((m) => m.id === mealType) || MEAL_TYPES[0];
}

export function getGoalModeMeta(modeId) {
  return GOAL_MODES.find((m) => m.id === modeId) || GOAL_MODES.find((m) => m.id === DEFAULT_GOAL_MODE);
}

export function getActivityLevelMeta(levelId) {
  return ACTIVITY_LEVELS.find((a) => a.id === levelId) || ACTIVITY_LEVELS.find((a) => a.id === DEFAULT_ACTIVITY_LEVEL);
}

export function calculateBMR({ weightKg, heightCm, age, gender } = {}) {
  const weight = Number(weightKg);
  if (!Number.isFinite(weight) || weight <= 0) return null;
  const height = Number(heightCm) > 0 ? Number(heightCm) : 170;
  const years = Number(age) > 0 ? Number(age) : 30;
  const base = 10 * weight + 6.25 * height - 5 * years;
  return Math.round(gender === "female" ? base - 161 : base + 5);
}

export function calculateTDEE(bmr, activityLevel = DEFAULT_ACTIVITY_LEVEL) {
  if (!Number.isFinite(bmr) || bmr <= 0) return null;
  return Math.round(bmr * getActivityLevelMeta(activityLevel).factor);
}

export function getCalorieTarget(tdee, goalMode = DEFAULT_GOAL_MODE) {
  if (!Number.isFinite(tdee) || tdee <= 0) return null;
  return Math.round(tdee * (1 + getGoalModeMeta(goalMode).calorieAdjustPct));
}

export function getProteinTarget(weightKg, goalMode = DEFAULT_GOAL_MODE) {
  const weight = Number(weightKg);
  if (!Number.isFinite(weight) || weight <= 0) return null;
  return Math.round(weight * getGoalModeMeta(goalMode).proteinPerKg);
}

export function getMacroTargets({ weightKg, heightCm, age, gender, activityLevel, goalMode } = {}) {
  const bmr = calculateBMR({ weightKg, heightCm, age, gender });
  const tdee = calculateTDEE(bmr, activityLevel);
  const calorieTarget = getCalorieTarget(tdee, goalMode);
  const proteinTarget = getProteinTarget(weightKg, goalMode);

  if (!calorieTarget || !proteinTarget) {
    return { bmr, tdee, calorieTarget, proteinTarget, carbsTarget: null, fatTarget: null };
  }

  const fatTarget = Math.round((calorieTarget * 0.25) / 9);
  const remainingKcal = Math.max(0, calorieTarget - proteinTarget * 4 - fatTarget * 9);
  const carbsTarget = Math.round(remainingKcal / 4);

  return { bmr, tdee, calorieTarget, proteinTarget, carbsTarget, fatTarget };
}

export function sumDailyMacros(meals = []) {
  return meals.reduce(
    (sum, meal) => ({
      kcal: sum.kcal + (Number(meal?.kcal) || 0),
      protein: sum.protein + (Number(meal?.protein) || 0),
      carbs: sum.carbs + (Number(meal?.carbs) || 0),
      fat: sum.fat + (Number(meal?.fat) || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function getMacroProgress(current, target) {
  const value = Number(current) || 0;
  const goal = Number(target);
  if (!Number.isFinite(goal) || goal <= 0) return 0;
  return clamp(Math.round((value / goal) * 100), 0, 100);
}

export function getConsecutiveShortfallDays(dailyRecords = [], targetValue, key = "protein") {
  if (!Number.isFinite(targetValue) || targetValue <= 0) return 0;
  let streak = 0;
  for (const day of dailyRecords) {
    if ((Number(day?.[key]) || 0) < targetValue) streak++;
    else break;
  }
  return streak;
}

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeMealRecord(record = {}) {
  const now = new Date().toISOString();
  const date = record.date || record.createdAt || now;
  const createdAt = record.createdAt || date || now;
  const updatedAt = record.updatedAt || record.modifiedAt || createdAt;
  const syncVersion = Math.max(1, Math.round(toFiniteNumber(record.syncVersion) ?? 1));
  const mealType = MEAL_TYPES.some((m) => m.id === record.mealType) ? record.mealType : "snack";

  return {
    id: record.id || generateId(),
    date,
    mealType,
    foodName: typeof record.foodName === "string" ? record.foodName.trim().slice(0, 60) : "",
    amount: toFiniteNumber(record.amount),
    unit: typeof record.unit === "string" && record.unit.trim() ? record.unit.trim().slice(0, 20) : "g",
    kcal: Math.max(0, toFiniteNumber(record.kcal) ?? 0),
    protein: Math.max(0, toFiniteNumber(record.protein) ?? 0),
    carbs: Math.max(0, toFiniteNumber(record.carbs) ?? 0),
    fat: Math.max(0, toFiniteNumber(record.fat) ?? 0),
    memo: typeof record.memo === "string" ? record.memo.trim().slice(0, 160) : "",
    createdAt,
    updatedAt,
    syncVersion,
  };
}

export function isValidImportedMeal(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return false;
  if (typeof record.foodName !== "string" || !record.foodName.trim()) return false;
  const kcal = Number(record.kcal);
  if (!Number.isFinite(kcal) || kcal < 0) return false;
  if (record.date && Number.isNaN(new Date(record.date).getTime())) return false;
  return true;
}

export function normalizeNutritionGoal(goal) {
  if (!goal || typeof goal !== "object") return null;
  const calorieTarget = toFiniteNumber(goal.calorieTarget);
  const proteinTarget = toFiniteNumber(goal.proteinTarget);
  if (!calorieTarget || !proteinTarget) return null;
  const now = new Date().toISOString();
  return {
    calorieTarget,
    proteinTarget,
    carbsTarget: toFiniteNumber(goal.carbsTarget),
    fatTarget: toFiniteNumber(goal.fatTarget),
    mode: typeof goal.mode === "string" ? goal.mode : DEFAULT_GOAL_MODE,
    weightKg: toFiniteNumber(goal.weightKg),
    createdAt: goal.createdAt || now,
    updatedAt: goal.updatedAt || now,
    syncVersion: Math.max(1, Math.round(toFiniteNumber(goal.syncVersion) ?? 1)),
  };
}

export function normalizeFavorite(favorite = {}) {
  return {
    id: favorite.id || generateId(),
    foodName: typeof favorite.foodName === "string" ? favorite.foodName.trim().slice(0, 60) : "",
    amount: toFiniteNumber(favorite.amount),
    unit: typeof favorite.unit === "string" && favorite.unit.trim() ? favorite.unit.trim().slice(0, 20) : "g",
    kcal: Math.max(0, toFiniteNumber(favorite.kcal) ?? 0),
    protein: Math.max(0, toFiniteNumber(favorite.protein) ?? 0),
    carbs: Math.max(0, toFiniteNumber(favorite.carbs) ?? 0),
    fat: Math.max(0, toFiniteNumber(favorite.fat) ?? 0),
    createdAt: favorite.createdAt || new Date().toISOString(),
  };
}
