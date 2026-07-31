import React from "react";
import { BookOpen } from "lucide-react";
import { FORMULA_LIST } from "../utils/formulas";

export function FormulaGuide() {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen size={15} style={{ color: "var(--accent)" }} />
        <span className="section-label">왜 이 공식을 쓰나요</span>
      </div>

      <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
        1RM(1 Rep Max)은 한 번에 들 수 있는 최대 무게입니다. 매번 한계 중량으로 테스트하지 않아도,
        가벼운 무게로 여러 번 반복한 기록으로 1RM을 추정할 수 있습니다. 벤치프레스, 스쿼트, 데드리프트처럼
        종목마다 반복 횟수에 따른 힘 감소 패턴이 달라 추천 공식도 다르게 적용합니다.
      </p>

      <div className="space-y-2.5">
        {FORMULA_LIST.map((formula) => (
          <div key={formula.id} className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold shrink-0" style={{ color: "var(--text-1)" }}>
              {formula.label}
            </span>
            <span className="text-xs text-right" style={{ color: "var(--text-2)" }}>
              {formula.description}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
        반복 횟수가 적을수록(1~3회) 추정 오차가 작아 신뢰도가 높고, 반복 횟수가 많아질수록(9회 이상)
        실제 1RM과 차이가 커질 수 있어 결과 카드에 신뢰도와 예상 범위를 함께 표시합니다.
      </p>
    </div>
  );
}
