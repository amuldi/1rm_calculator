export const REMOTE_USER_DATA_COLLECTIONS = [
  "workoutRecords",
  "deletedWorkoutRecords",
  "goals",
  "deletedGoals",
];

export const LOCAL_STORAGE_KEYS = [
  "1rm-workout",
  "1rm-goals",
  "1rm-ui",
  "1rm-sync",
  "1rm-diagnostics",
];

export const ACCOUNT_DELETION_STEPS = [
  "요청 이메일에서 Firebase Auth 이메일 또는 uid를 확인합니다.",
  "Firestore users/{uid} 아래의 workoutRecords, deletedWorkoutRecords, goals, deletedGoals 문서를 삭제합니다.",
  "필요하면 Firebase Auth 사용자 계정을 비활성화하거나 삭제합니다.",
  "처리 결과와 로컬 데이터 삭제 방법을 사용자에게 회신합니다.",
];

export function getRemoteDeletionScope() {
  return REMOTE_USER_DATA_COLLECTIONS.map((collection) => `users/{uid}/${collection}`);
}

export function getLocalDeletionScope() {
  return LOCAL_STORAGE_KEYS;
}

export function getAccountDeletionRequestBody() {
  return [
    "계정 데이터 삭제를 요청합니다.",
    "",
    "Firebase Auth 이메일 또는 uid:",
    "요청 사유(선택):",
    "",
    "삭제 대상:",
    ...getRemoteDeletionScope().map((path) => `- ${path}`),
    "",
    "로컬 브라우저 데이터는 사용자가 프로필의 기록 삭제 또는 브라우저 사이트 데이터 삭제로 직접 지울 수 있음을 이해했습니다.",
  ].join("\n");
}
