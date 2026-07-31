import { useState, useCallback, useMemo } from "react";
import { useNutritionStore } from "@/store/nutritionStore";
import { toDateInputValue } from "@/lib/utils";
import {
  MEAL_TYPES,
  getMacroProgress,
  getMacroTargets,
  getConsecutiveShortfallDays,
} from "../utils/nutritionMath";

function validate(foodName, kcal, protein) {
  const errs = {};
  if (!foodName || !foodName.trim()) errs.foodName = "음식 이름을 입력하세요.";
  const k = parseFloat(kcal);
  if (!kcal || isNaN(k) || k < 0) errs.kcal = "0 이상의 칼로리를 입력하세요.";
  else if (k > 5000) errs.kcal = "5000kcal 이하로 입력하세요.";
  const p = protein === "" ? 0 : parseFloat(protein);
  if (isNaN(p) || p < 0) errs.protein = "0 이상의 값을 입력하세요.";
  return errs;
}

export function useNutrition() {
  const [selectedDate, setSelectedDate] = useState(() => toDateInputValue());
  const [mealType, setMealType] = useState("breakfast");
  const [foodName, setFoodName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("g");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState({});

  const {
    meals,
    addMeal,
    favorites,
    addFavorite,
    goal,
    getMealsByDate,
    getRecentDailyTotals,
  } = useNutritionStore();

  const dailyTotals = useMemo(
    () => getMealsByDate(selectedDate).reduce(
      (sum, meal) => ({
        kcal: sum.kcal + meal.kcal,
        protein: sum.protein + meal.protein,
        carbs: sum.carbs + meal.carbs,
        fat: sum.fat + meal.fat,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    ),
    [getMealsByDate, meals, selectedDate]
  );

  const progress = useMemo(() => ({
    kcal: getMacroProgress(dailyTotals.kcal, goal?.calorieTarget),
    protein: getMacroProgress(dailyTotals.protein, goal?.proteinTarget),
    carbs: getMacroProgress(dailyTotals.carbs, goal?.carbsTarget),
    fat: getMacroProgress(dailyTotals.fat, goal?.fatTarget),
  }), [dailyTotals, goal]);

  const proteinShortfallStreak = useMemo(() => {
    if (!goal?.proteinTarget) return 0;
    return getConsecutiveShortfallDays(getRecentDailyTotals(7), goal.proteinTarget, "protein");
  }, [getRecentDailyTotals, goal?.proteinTarget, meals]);

  const reset = useCallback(() => {
    setFoodName("");
    setAmount("");
    setKcal("");
    setProtein("");
    setCarbs("");
    setFat("");
    setMemo("");
    setErrors({});
  }, []);

  const applyFavorite = useCallback((favorite) => {
    setFoodName(favorite.foodName);
    setAmount(favorite.amount != null ? String(favorite.amount) : "");
    setUnit(favorite.unit || "g");
    setKcal(String(favorite.kcal));
    setProtein(String(favorite.protein));
    setCarbs(String(favorite.carbs));
    setFat(String(favorite.fat));
  }, []);

  const saveAsFavorite = useCallback(() => {
    if (!foodName.trim() || !kcal) return;
    addFavorite({
      foodName: foodName.trim(),
      amount: amount ? parseFloat(amount) : null,
      unit,
      kcal: parseFloat(kcal) || 0,
      protein: protein ? parseFloat(protein) : 0,
      carbs: carbs ? parseFloat(carbs) : 0,
      fat: fat ? parseFloat(fat) : 0,
    });
  }, [addFavorite, amount, carbs, fat, foodName, kcal, protein, unit]);

  const submitMeal = useCallback(() => {
    const errs = validate(foodName, kcal, protein);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return null;
    }
    setErrors({});

    const meal = addMeal({
      mealType,
      foodName: foodName.trim(),
      amount: amount ? parseFloat(amount) : null,
      unit,
      kcal: parseFloat(kcal) || 0,
      protein: protein ? parseFloat(protein) : 0,
      carbs: carbs ? parseFloat(carbs) : 0,
      fat: fat ? parseFloat(fat) : 0,
      memo,
      date: new Date(`${selectedDate}T12:00:00`).toISOString(),
    });
    reset();
    return meal;
  }, [addMeal, amount, carbs, fat, foodName, kcal, mealType, memo, protein, reset, selectedDate, unit]);

  return {
    selectedDate, setSelectedDate,
    mealType, setMealType,
    foodName, setFoodName,
    amount, setAmount,
    unit, setUnit,
    kcal, setKcal,
    protein, setProtein,
    carbs, setCarbs,
    fat, setFat,
    memo, setMemo,
    errors,
    mealTypes: MEAL_TYPES,
    favorites,
    applyFavorite,
    saveAsFavorite,
    submitMeal,
    reset,
    dailyTotals,
    goal,
    progress,
    proteinShortfallStreak,
  };
}
