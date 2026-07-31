import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Pencil, Trash2, UtensilsCrossed, X } from "lucide-react";
import { useNutritionStore } from "@/store/nutritionStore";
import { Card } from "@/components/common/Card";
import { getMealTypeMeta } from "../utils/nutritionMath";

export function MealList({ date }) {
  const { meals, deleteMeal, updateMeal } = useNutritionStore();
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const dayMeals = useMemo(
    () => meals.filter((m) => m.date?.split("T")[0] === date),
    [meals, date]
  );

  const grouped = useMemo(() => {
    const g = {};
    for (const meal of dayMeals) {
      if (!g[meal.mealType]) g[meal.mealType] = [];
      g[meal.mealType].push(meal);
    }
    return g;
  }, [dayMeals]);

  if (!dayMeals.length) {
    return (
      <Card className="p-8 text-center space-y-2">
        <UtensilsCrossed size={24} style={{ color: "var(--text-3)", margin: "0 auto" }} />
        <p className="text-sm" style={{ color: "var(--text-2)" }}>이 날짜에 기록된 식사가 없습니다.</p>
      </Card>
    );
  }

  const startEdit = (meal) => {
    setEditingId(meal.id);
    setDraft({
      foodName: meal.foodName,
      kcal: String(meal.kcal),
      protein: String(meal.protein),
      carbs: String(meal.carbs),
      fat: String(meal.fat),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = (meal) => {
    if (!draft) return;
    const kcal = parseFloat(draft.kcal);
    if (!draft.foodName?.trim() || isNaN(kcal) || kcal < 0) return;
    updateMeal(meal.id, {
      foodName: draft.foodName.trim(),
      kcal,
      protein: parseFloat(draft.protein) || 0,
      carbs: parseFloat(draft.carbs) || 0,
      fat: parseFloat(draft.fat) || 0,
    });
    cancelEdit();
  };

  return (
    <Card className="overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <span className="section-label">식사 목록</span>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
        {Object.entries(grouped).map(([mealType, items]) => {
          const meta = getMealTypeMeta(mealType);
          return (
            <div key={mealType} className="px-5 py-3.5">
              <p className="text-xs font-bold mb-2" style={{ color: "var(--text-3)" }}>{meta.label}</p>
              <div className="space-y-1.5">
                {items.map((meal) => {
                  const isEditing = editingId === meal.id;
                  return (
                    <motion.div
                      key={meal.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -16 }}
                      className="px-4 py-3 rounded-lg"
                      style={{ background: "var(--row-bg)" }}
                    >
                      {isEditing ? (
                        <div className="space-y-2.5">
                          <input
                            value={draft?.foodName ?? ""}
                            onChange={(e) => setDraft((c) => ({ ...(c || {}), foodName: e.target.value }))}
                            className="field text-sm"
                            aria-label="수정할 음식 이름"
                          />
                          <div className="grid grid-cols-4 gap-2">
                            <input type="number" inputMode="decimal" value={draft?.kcal ?? ""} onChange={(e) => setDraft((c) => ({ ...(c || {}), kcal: e.target.value }))} className="field text-sm" aria-label="수정할 칼로리" />
                            <input type="number" inputMode="decimal" value={draft?.protein ?? ""} onChange={(e) => setDraft((c) => ({ ...(c || {}), protein: e.target.value }))} className="field text-sm" aria-label="수정할 단백질" />
                            <input type="number" inputMode="decimal" value={draft?.carbs ?? ""} onChange={(e) => setDraft((c) => ({ ...(c || {}), carbs: e.target.value }))} className="field text-sm" aria-label="수정할 탄수화물" />
                            <input type="number" inputMode="decimal" value={draft?.fat ?? ""} onChange={(e) => setDraft((c) => ({ ...(c || {}), fat: e.target.value }))} className="field text-sm" aria-label="수정할 지방" />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button onClick={cancelEdit} className="btn-ghost px-3 py-2 text-xs" aria-label="수정 취소">
                              <X size={13} />
                              취소
                            </button>
                            <button onClick={() => saveEdit(meal)} className="btn-accent px-3 py-2 text-xs" aria-label="수정 저장">
                              <Check size={13} />
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>{meal.foodName}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>
                              {meal.kcal}kcal · 단백질 {meal.protein}g · 탄수 {meal.carbs}g · 지방 {meal.fat}g
                            </p>
                            {meal.memo && (
                              <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-3)" }}>{meal.memo}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => startEdit(meal)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                              style={{ color: "var(--text-3)" }}
                              aria-label="식사 수정"
                              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-faint)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.background = "transparent"; }}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => deleteMeal(meal.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                              style={{ color: "var(--text-3)" }}
                              aria-label="식사 삭제"
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
            </div>
          );
        })}
      </div>
    </Card>
  );
}
