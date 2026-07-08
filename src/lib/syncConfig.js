export const FIREBASE_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];

export const OPTIONAL_FIREBASE_KEYS = [
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
];

const PLACEHOLDER_VALUES = new Set([
  "your-api-key",
  "your-auth-domain",
  "your-project-id",
  "your-app-id",
  "firebase-api-key",
  "firebase-auth-domain",
  "firebase-project-id",
  "firebase-app-id",
]);

function readRuntimeEnv() {
  return typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
}

function getEnvString(env, key) {
  return String(env[key] || "").trim();
}

function isPlaceholderValue(value) {
  return PLACEHOLDER_VALUES.has(value.toLowerCase()) || value.includes("<") || value.includes(">");
}

function isValidFirebaseApiKey(value) {
  return /^AIza[0-9A-Za-z_-]{20,}$/.test(value);
}

function isValidAuthDomain(value) {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value) && !value.includes("://");
}

function isValidProjectId(value) {
  return /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(value);
}

function isValidAppId(value) {
  return /^1:\d+:web:[0-9a-f]+$/i.test(value);
}

function getMessagingSenderIdFromAppId(value) {
  return value.match(/^1:(\d+):web:/)?.[1] || "";
}

const FIREBASE_ENV_VALIDATORS = {
  VITE_FIREBASE_API_KEY: {
    isValid: isValidFirebaseApiKey,
    message: "Firebase Web API key는 보통 AIza로 시작하는 값이어야 합니다.",
  },
  VITE_FIREBASE_AUTH_DOMAIN: {
    isValid: isValidAuthDomain,
    message: "Auth domain은 프로토콜 없이 example.firebaseapp.com 형태여야 합니다.",
  },
  VITE_FIREBASE_PROJECT_ID: {
    isValid: isValidProjectId,
    message: "Project ID는 소문자, 숫자, 하이픈으로 된 Firebase 프로젝트 ID여야 합니다.",
  },
  VITE_FIREBASE_APP_ID: {
    isValid: isValidAppId,
    message: "App ID는 1:...:web:... 형태의 Firebase Web app ID여야 합니다.",
  },
};

export function getFirebaseConfig(env = readRuntimeEnv()) {
  return {
    apiKey: getEnvString(env, "VITE_FIREBASE_API_KEY"),
    authDomain: getEnvString(env, "VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: getEnvString(env, "VITE_FIREBASE_PROJECT_ID"),
    appId: getEnvString(env, "VITE_FIREBASE_APP_ID"),
    storageBucket: getEnvString(env, "VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: getEnvString(env, "VITE_FIREBASE_MESSAGING_SENDER_ID"),
  };
}

export function validateFirebaseEnv(env = readRuntimeEnv()) {
  return FIREBASE_KEYS.map((key) => {
    const value = getEnvString(env, key);
    const validator = FIREBASE_ENV_VALIDATORS[key];
    const missing = !value;
    const invalid = !missing && (isPlaceholderValue(value) || !validator.isValid(value));
    return {
      key,
      missing,
      invalid,
      valid: !missing && !invalid,
      message: invalid ? validator.message : "",
    };
  });
}

export function auditFirebaseEnvConsistency(env = readRuntimeEnv(), { requireConfigured = false } = {}) {
  const validation = validateFirebaseEnv(env);
  const missing = validation.filter((item) => item.missing).map((item) => item.key);
  const invalid = validation.filter((item) => item.invalid);
  const issues = invalid.map((item) => ({
    key: item.key,
    type: "invalid",
    message: item.message,
  }));

  if (requireConfigured) {
    for (const key of missing) {
      issues.push({
        key,
        type: "missing",
        message: `${key} is required for a release environment.`,
      });
    }
  }

  const config = getFirebaseConfig(env);
  const expectedAuthDomain = config.projectId ? `${config.projectId}.firebaseapp.com` : "";
  if (config.authDomain && config.projectId && config.authDomain !== expectedAuthDomain) {
    issues.push({
      key: "VITE_FIREBASE_AUTH_DOMAIN",
      type: "mismatch",
      message: `Auth domain should match the project ID: ${expectedAuthDomain}.`,
    });
  }

  const expectedStorageBucket = config.projectId ? `${config.projectId}.appspot.com` : "";
  if (config.storageBucket && config.projectId && config.storageBucket !== expectedStorageBucket) {
    issues.push({
      key: "VITE_FIREBASE_STORAGE_BUCKET",
      type: "mismatch",
      message: `Storage bucket should match the project ID: ${expectedStorageBucket}.`,
    });
  }

  const senderFromAppId = getMessagingSenderIdFromAppId(config.appId);
  if (config.messagingSenderId && senderFromAppId && config.messagingSenderId !== senderFromAppId) {
    issues.push({
      key: "VITE_FIREBASE_MESSAGING_SENDER_ID",
      type: "mismatch",
      message: `Messaging sender ID should match the Firebase app ID sender segment: ${senderFromAppId}.`,
    });
  }

  return {
    valid: issues.length === 0,
    requireConfigured,
    configured: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    optionalKeys: OPTIONAL_FIREBASE_KEYS,
    issues,
  };
}

export function getSyncStatus(env = readRuntimeEnv()) {
  const validation = validateFirebaseEnv(env);
  const audit = auditFirebaseEnvConsistency(env);
  const missing = validation.filter((item) => item.missing).map((item) => item.key);
  const invalid = validation.filter((item) => item.invalid).map((item) => item.key);
  const configured = missing.length === 0 && invalid.length === 0 && audit.valid;
  return {
    mode: configured ? "ready" : "local",
    provider: "firebase",
    configured,
    missing,
    invalid,
    issues: audit.issues,
    validation,
    message: configured
      ? "Firebase 환경 설정이 준비되었습니다. Auth/Firestore 연결 단계를 진행할 수 있습니다."
      : audit.issues.length > 0
        ? "Firebase 환경 변수 값 형식이 올바르지 않아 로컬 저장 모드로 동작합니다."
        : "현재는 로컬 저장 모드입니다. Firebase 환경 변수를 추가하면 계정 동기화 준비 모드로 전환됩니다.",
  };
}
