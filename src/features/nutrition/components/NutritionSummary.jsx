import React from "react";
import { motion } from "framer-motion";
import { Flame, Target } from "lucide-react";
import { Card } from "@/components/common/Card";

const ROWS = [
  { key: "kcal", label: "칼로리", unit: "kcal" },
  { key: "protein", label: "단백질", unit: "g" },
  { key: "carbs", label: "탄수화물", unit: "g" },
  { key: "fat", label: "지방", unit: "g" },
];

function buildInsight(proteinShortfallStreak, goal) {
  if (!goal) return null;
  if (proteinShortfallStreak >= 2) {
    return `${proteinShortfallStreak}일 연속 단백질 목표 미달입니다. 다음 식사에 단백질 위주 메뉴를 추가해보세요.`;
  }
  return null;
}

export function NutritionSummary({ dailyTotals, goal, progress, proteinShortfallStreak = 0 }) {
  const insight = buildInsight(proteinShortfallStreak, goal);
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Flame size={15} style={{ color: "var(--accent)" }} />
        <span className="section-label">오늘의 영양 섭취</span>
      </div>

      {!goal ? (
        <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "var(--row-bg)" }}>
          <Target size={16} style={{ color: "var(--text-3)" }} className="shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
            목표를 설정하면 칼로리·단백질 달성률을 확인할 수 있습니다. 아래에서 체중과 목표 모드를 선택하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ROWS.map((row) => {
            const target = goal[`${row.key === "kcal" ? "calorie" : row.key}Target`];
            const pct = progress[row.key] ?? 0;
            const done = pct >= 100;
            return (
              <div key={row.key} className="space-y-1.5">
                <div className="flex justify-between text-xs" style={{ color: "var(--text-2)" }}>
                  <span>{row.label}</span>
                  <span>
                    {Math.round(dailyTotals[row.key])} / {target ?? "—"} {row.unit} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted-fill)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background: done ? "var(--accent)" : "linear-gradient(to right, var(--accent), rgba(244,189,80,0.65))",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {insight && (
        <p
          className="text-xs leading-relaxed px-3 py-2.5 rounded-lg"
          style={{ background: "var(--red-faint)", color: "var(--red)" }}
        >
          {insight}
        </p>
      )}
    </Card>
  );
}
