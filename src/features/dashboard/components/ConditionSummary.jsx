import React from "react";
import { Sparkles } from "lucide-react";

function buildMessage({ streak, weeklyVol, unit, caloriePct, proteinPct, hasNutritionGoal, hasMealsToday, hasHistory }) {
  const workoutPart = streak > 0
    ? `${streak}일 연속 운동 중이며 이번 주 볼륨은 ${weeklyVol.toLocaleString()}${unit}입니다.`
    : hasHistory
      ? "오늘은 아직 운동 기록이 없습니다. 오늘 세션을 기록해보세요."
      : "최근 운동 기록이 없습니다. 오늘 세션을 기록해보세요.";

  if (!hasNutritionGoal) {
    return `${workoutPart} 영양 목표를 설정하면 식단 상태까지 함께 요약해드립니다.`;
  }
  if (!hasMealsToday) {
    return `${workoutPart} 오늘 식사 기록이 아직 없습니다.`;
  }

  const nutritionPart = caloriePct >= 90 && proteinPct >= 90
    ? "칼로리와 단백질 목표를 잘 지키고 있습니다."
    : proteinPct < 70
      ? `단백질 섭취가 목표의 ${proteinPct}%로 부족한 편입니다.`
      : `칼로리 ${caloriePct}%, 단백질 ${proteinPct}% 달성했습니다.`;

  return `${workoutPart} ${nutritionPart}`;
}

export function ConditionSummary(props) {
  const message = buildMessage(props);
  return (
    <div className="card p-5 flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "var(--accent-faint)" }}
      >
        <Sparkles size={18} style={{ color: "var(--accent)" }} />
      </div>
      <div>
        <p className="section-label mb-1">오늘의 컨디션</p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-1)" }}>{message}</p>
      </div>
    </div>
  );
}
