import { validateFirebaseEnv } from "./syncConfig.js";
import { getSupportConfig } from "./supportConfig.js";

const REQUIRED_FIREBASE_ENV = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];

export const FIREBASE_ENV_GUIDE = [
  {
    key: "VITE_FIREBASE_API_KEY",
    required: true,
    source: "Firebase Console > Project settings > Web app config",
    purpose: "Firebase 앱 식별과 클라이언트 SDK 초기화",
  },
  {
    key: "VITE_FIREBASE_AUTH_DOMAIN",
    required: true,
    source: "Firebase Console > Authentication domain",
    purpose: "Google 로그인 팝업과 Auth 세션 처리",
  },
  {
    key: "VITE_FIREBASE_PROJECT_ID",
    required: true,
    source: "Firebase Console > Project ID",
    purpose: "Firestore 프로젝트 연결",
  },
  {
    key: "VITE_FIREBASE_APP_ID",
    required: true,
    source: "Firebase Console > Web app config",
    purpose: "Firebase Web App 식별",
  },
  {
    key: "VITE_FIREBASE_STORAGE_BUCKET",
    required: false,
    source: "Firebase Console > Web app config",
    purpose: "향후 파일 백업 기능 확장 대비",
  },
  {
    key: "VITE_FIREBASE_MESSAGING_SENDER_ID",
    required: false,
    source: "Firebase Console > Web app config",
    purpose: "Firebase Web App 구성값 보존",
  },
  {
    key: "VITE_SUPPORT_EMAIL",
    required: true,
    source: "운영자가 받을 지원 이메일",
    purpose: "데이터 삭제 요청과 운영 문의 채널",
  },
];

export const RELEASE_SETUP_STEPS = [
  "Firebase Console에서 Web app을 만들고 필수 환경 변수를 배포 환경에 등록합니다.",
  "로컬에서는 npm run verify:env, 배포 CI에서는 REQUIRE_FIREBASE_ENV=1 npm run verify:env로 설정값을 검증합니다.",
  "Authentication에서 Google provider를 활성화하고 배포 도메인을 승인 도메인에 추가합니다.",
  "Firestore 데이터베이스를 만들고 firestore.rules를 배포합니다.",
  "npm run check와 CI 브라우저 QA를 통과시킨 뒤 Google 로그인과 동기화를 실제 계정으로 확인합니다.",
  "VITE_SUPPORT_EMAIL을 연결하고 데이터 삭제 요청 메일 링크를 확인합니다.",
];

export const RELEASE_CHECKLIST = [
  {
    id: "release-preflight",
    label: "릴리즈 프리플라이트",
    evidence: "npm run verify:release",
    required: true,
  },
  {
    id: "build",
    label: "프로덕션 빌드",
    evidence: "npm run build",
    required: true,
  },
  {
    id: "logic-tests",
    label: "핵심 로직 테스트",
    evidence: "npm run test",
    required: true,
  },
  {
    id: "firebase-env",
    label: "Firebase 환경 변수",
    evidence: "npm run verify:env, REQUIRE_FIREBASE_ENV=1 npm run verify:env",
    required: true,
  },
  {
    id: "firestore-rules",
    label: "Firestore 보안 규칙",
    evidence: "firestore.rules 배포",
    required: true,
  },
  {
    id: "browser-qa",
    label: "브라우저 주요 플로우 QA",
    evidence: "계산, 수정, 목표, 동기화, 백업, 삭제",
    required: true,
  },
  {
    id: "performance-budget",
    label: "성능 예산",
    evidence: "npm run verify:performance",
    required: true,
  },
  {
    id: "ci",
    label: "CI 품질 게이트",
    evidence: "GitHub Actions: npm run check, npm run qa:browser:server",
    required: true,
  },
  {
    id: "privacy",
    label: "데이터 처리 안내",
    evidence: "/privacy 화면",
    required: true,
  },
  {
    id: "support-contact",
    label: "운영 문의 채널",
    evidence: "VITE_SUPPORT_EMAIL",
    required: true,
  },
];

export function getMissingFirebaseEnv(env = {}) {
  return validateFirebaseEnv(env).filter((item) => item.missing).map((item) => item.key);
}

export function getInvalidFirebaseEnv(env = {}) {
  return validateFirebaseEnv(env).filter((item) => item.invalid);
}

export function getFirebaseEnvReadiness(env = {}) {
  const validationByKey = new Map(validateFirebaseEnv(env).map((item) => [item.key, item]));
  return FIREBASE_ENV_GUIDE.map((item) => ({
    ...item,
    configured: item.key === "VITE_SUPPORT_EMAIL"
      ? getSupportConfig(env).configured
      : Boolean(validationByKey.get(item.key)?.valid),
    invalid: item.key === "VITE_SUPPORT_EMAIL"
      ? getSupportConfig(env).invalid
      : Boolean(validationByKey.get(item.key)?.invalid),
    message: validationByKey.get(item.key)?.message || "",
  }));
}

export function getReleaseReadiness({ env = {}, checks = {} } = {}) {
  const missingEnv = getMissingFirebaseEnv(env);
  const invalidEnv = getInvalidFirebaseEnv(env);
  const support = getSupportConfig(env);
  const items = RELEASE_CHECKLIST.map((item) => {
    const passed = item.id === "firebase-env"
      ? missingEnv.length === 0 && invalidEnv.length === 0
      : item.id === "support-contact"
        ? support.configured
        : Boolean(checks[item.id]);
    return { ...item, passed };
  });
  const requiredItems = items.filter((item) => item.required);
  const passedRequired = requiredItems.filter((item) => item.passed).length;

  return {
    ready: passedRequired === requiredItems.length,
    passedRequired,
    totalRequired: requiredItems.length,
    missingEnv,
    invalidEnv,
    items,
  };
}

export function getReadinessStatusLabel({ ready = false, passedRequired = 0, totalRequired = 0 } = {}) {
  if (ready) return "출시 가능";
  if (passedRequired === 0) return "준비 필요";
  return `${passedRequired}/${totalRequired} 확인`;
}
