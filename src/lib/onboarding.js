export const ONBOARDING_STEPS = [
  {
    title: "1RM 계산",
    body: "운동 종목, 무게, 반복 횟수를 입력해 첫 기준값을 만듭니다.",
  },
  {
    title: "세션 기록",
    body: "세트 수, RPE, 날짜, 메모를 함께 남기면 분석 품질이 좋아집니다.",
  },
  {
    title: "목표 설정",
    body: "목표 1RM과 목표일을 넣으면 필요한 주간 증가량을 계산합니다.",
  },
];

export function getEmptyDashboardCopy() {
  return {
    title: "첫 기록을 시작하세요",
    body: "1RM을 계산하면 대시보드에 운동 기록, 볼륨, 목표 진행률이 표시됩니다.",
    action: "1RM 계산하기",
    steps: ONBOARDING_STEPS,
  };
}

export function getEmptyAnalyticsCopy(periodLabel = "선택한 기간") {
  return {
    title: `${periodLabel}에 분석할 기록이 없습니다`,
    body: "첫 기록을 만들면 PR 후보, RPE 강도, 종목별 흐름을 분석합니다.",
    action: "기록하러 가기",
  };
}
