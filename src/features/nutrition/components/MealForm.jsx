import React from "react";
import { Utensils, Star } from "lucide-react";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Field } from "@/components/common/Field";

export function MealForm({
  mealTypes,
  mealType, setMealType,
  foodName, setFoodName,
  amount, setAmount,
  unit, setUnit,
  kcal, setKcal,
  protein, setProtein,
  carbs, setCarbs,
  fat, setFat,
  memo, setMemo,
  errors = {},
  favorites = [],
  onApplyFavorite,
  onSaveFavorite,
  onSubmit,
}) {
  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <span className="section-label">식사 기록</span>
        <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: "var(--control-bg)" }}>
          {mealTypes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMealType(m.id)}
              className="px-2.5 py-1 rounded-md text-xs font-bold transition-all"
              style={{
                background: mealType === m.id ? "var(--accent)" : "transparent",
                color: mealType === m.id ? "var(--text-on-accent)" : "var(--text-2)",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {favorites.length > 0 && (
        <div className="space-y-1.5">
          <label className="label">즐겨찾기</label>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {favorites.map((favorite) => (
              <button
                key={favorite.id}
                type="button"
                onClick={() => onApplyFavorite(favorite)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: "var(--row-bg)", border: "1px solid var(--border-subtle)", color: "var(--text-1)" }}
              >
                {favorite.foodName}
                <span className="ml-1.5" style={{ color: "var(--text-2)" }}>{favorite.kcal}kcal</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Field
        label="음식 이름"
        value={foodName}
        onChange={(e) => setFoodName(e.target.value)}
        placeholder="예: 닭가슴살 샐러드"
        error={errors.foodName}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="섭취량"
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="150"
        />
        <Field
          label="단위"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="g"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="칼로리 (kcal)"
          type="number"
          inputMode="decimal"
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          placeholder="350"
          error={errors.kcal}
        />
        <Field
          label="단백질 (g)"
          type="number"
          inputMode="decimal"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          placeholder="30"
          error={errors.protein}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="탄수화물 (g)"
          type="number"
          inputMode="decimal"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
          placeholder="20"
        />
        <Field
          label="지방 (g)"
          type="number"
          inputMode="decimal"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
          placeholder="10"
        />
      </div>

      <Field
        as="textarea"
        label="메모"
        value={memo}
        onChange={(e) => setMemo(e.target.value.slice(0, 160))}
        placeholder="조리 방법, 컨디션 등을 기록하세요"
        rows={2}
        inputClassName="resize-none"
      />

      <div className="flex gap-2">
        <Button variant="ghost" size="md" onClick={onSaveFavorite} className="shrink-0" aria-label="즐겨찾기에 저장">
          <Star size={15} />
        </Button>
        <Button variant="accent" size="lg" onClick={onSubmit} className="flex-1">
          <Utensils size={16} />
          식사 추가하기
        </Button>
      </div>
    </Card>
  );
}
