export const PRIVACY_UPDATED_AT = "2026-06-22";

export const PRIVACY_SECTIONS = [
  {
    title: "저장하는 데이터",
    items: [
      "운동 종목, 무게, 반복 횟수, 세트 수, RPE, 운동 날짜, 메모",
      "목표 1RM, 목표 날짜, 앱 설정",
      "계정 동기화 사용 시 Firebase Auth 사용자 ID와 이메일",
    ],
  },
  {
    title: "저장하지 않는 데이터",
    items: [
      "실명, 생년월일, 위치 정보",
      "신체 정보, 결제 정보, 연락처",
      "광고 추적 목적의 제3자 식별자",
    ],
  },
  {
    title: "데이터가 사용되는 방식",
    items: [
      "1RM 추정, 기록 분석, 목표 진행률 계산",
      "JSON 백업과 복원",
      "로그인한 경우 같은 계정의 기기 간 기록 동기화",
    ],
  },
  {
    title: "사용자 제어",
    items: [
      "프로필에서 JSON 백업을 내려받을 수 있습니다.",
      "프로필에서 운동 기록을 삭제할 수 있습니다.",
      "동기화 설정 전에는 데이터가 이 기기의 로컬 저장소에 남습니다.",
    ],
  },
  {
    title: "삭제 요청 범위",
    items: [
      "계정 동기화 데이터는 users/{uid}/workoutRecords, deletedWorkoutRecords, goals, deletedGoals 범위를 대상으로 삭제합니다.",
      "Firebase Auth 계정 삭제 또는 비활성화는 운영 문의 채널을 통해 요청할 수 있습니다.",
      "브라우저 로컬 데이터는 사용자가 프로필의 기록 삭제 또는 브라우저 사이트 데이터 삭제로 직접 지울 수 있습니다.",
    ],
  },
];

export function getPrivacySummary(sections = PRIVACY_SECTIONS) {
  return sections.map((section) => section.title).join(" · ");
}
