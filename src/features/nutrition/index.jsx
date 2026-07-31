import React from "react";
import { format, addDays, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MealForm } from "./components/MealForm";
import { MealList } from "./components/MealList";
import { NutritionSummary } from "./components/NutritionSummary";
import { GoalSetter } from "./components/GoalSetter";
import { useNutrition } from "./hooks/useNutrition";
import { toDateInputValue } from "@/lib/utils";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

export default function NutritionPage() {
  useDocumentMeta({
    title: "영양 기록 · 칼로리/단백질 계산기 | 식단 목표 관리",
    description: "체중과 활동 수준으로 칼로리·단백질 목표를 자동 계산하고 끼니별 식사를 기록하세요.",
  });
  const {
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
    mealTypes,
    favorites,
    applyFavorite,
    saveAsFavorite,
    submitMeal,
    dailyTotals,
    goal,
    progress,
    proteinShortfallStreak,
  } = useNutrition();

  const shiftDate = (delta) => {
    const next = addDays(parseISO(selectedDate), delta);
    setSelectedDate(toDateInputValue(next));
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-black" style={{ color: "var(--text-1)" }}>영양 기록</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>오늘 먹은 식사와 목표 대비 진행률을 관리합니다</p>
        </div>

        <div className="card px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => shiftDate(-1)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: "var(--text-2)" }}
            aria-label="전날로 이동"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
            {format(parseISO(selectedDate), "yyyy년 M월 d일")}
          </span>
          <button
            onClick={() => shiftDate(1)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: "var(--text-2)" }}
            aria-label="다음날로 이동"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <NutritionSummary
          dailyTotals={dailyTotals}
          goal={goal}
          progress={progress}
          proteinShortfallStreak={proteinShortfallStreak}
        />

        <MealForm
          mealTypes={mealTypes}
          mealType={mealType} setMealType={setMealType}
          foodName={foodName} setFoodName={setFoodName}
          amount={amount} setAmount={setAmount}
          unit={unit} setUnit={setUnit}
          kcal={kcal} setKcal={setKcal}
          protein={protein} setProtein={setProtein}
          carbs={carbs} setCarbs={setCarbs}
          fat={fat} setFat={setFat}
          memo={memo} setMemo={setMemo}
          errors={errors}
          favorites={favorites}
          onApplyFavorite={applyFavorite}
          onSaveFavorite={saveAsFavorite}
          onSubmit={submitMeal}
        />

        <GoalSetter />

        <MealList date={selectedDate} />
      </div>
    </div>
  );
}
