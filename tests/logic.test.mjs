import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  calculate1RM,
  getEstimateConfidence,
} from "../src/features/1rm/utils/formulas.js";
import {
  createBackupPayload,
  parseBackupPayload,
} from "../src/lib/backup.js";
import {
  createDiagnosticsPayload,
  getDiagnosticsSupportCopy,
  getDiagnosticsSummary,
  mergeDiagnosticEvents,
  normalizeDiagnosticEvent,
  serializeDiagnosticsPayload,
} from "../src/lib/diagnostics.js";
import {
  ACCOUNT_DELETION_STEPS,
  getAccountDeletionRequestBody,
  getLocalDeletionScope,
  getRemoteDeletionScope,
} from "../src/lib/dataLifecycle.js";
import {
  canAccessFirestorePath,
  canWriteFirestorePath,
  isValidDeletedRecordDocument,
  isValidGoalDocument,
  isValidWorkoutRecordDocument,
  parseUserScopedPath,
} from "../src/lib/firestoreAccessModel.js";
import { auditFirestoreRules } from "../src/lib/firestoreRulesAudit.js";
import { getGoalPlan } from "../src/lib/goalPlanning.js";
import {
  getPrivacySummary,
  PRIVACY_SECTIONS,
} from "../src/lib/privacyContent.js";
import {
  getEmptyAnalyticsCopy,
  getEmptyDashboardCopy,
  ONBOARDING_STEPS,
} from "../src/lib/onboarding.js";
import { getPWAStatusCopy } from "../src/lib/pwaStatus.js";
import {
  FIREBASE_ENV_GUIDE,
  getFirebaseEnvReadiness,
  getInvalidFirebaseEnv,
  getMissingFirebaseEnv,
  getReadinessStatusLabel,
  getReleaseReadiness,
  RELEASE_CHECKLIST,
  RELEASE_SETUP_STEPS,
} from "../src/lib/releaseReadiness.js";
import {
  getSyncSummary,
  isValidSyncTime,
  normalizeSyncStats,
} from "../src/lib/syncFeedback.js";
import {
  getDeletionRequestCopy,
  getSupportConfig,
} from "../src/lib/supportConfig.js";
import {
  syncUserDataWithServices,
  toFirestoreDeletedRecord,
  toFirestoreGoal,
  toFirestoreWorkoutRecord,
} from "../src/lib/syncService.js";
import {
  applyDeletedEntities,
  applyDeletedEntitiesToMap,
  mergeEntityList,
  mergeDeletedEntities,
  mergeGoalMaps,
  pickLatestEntity,
  pruneObsoleteDeletedEntities,
  pruneObsoleteDeletedEntitiesFromMap,
} from "../src/lib/syncModel.js";
import {
  auditFirebaseEnvConsistency,
  getFirebaseConfig,
  getSyncStatus,
} from "../src/lib/syncConfig.js";
import {
  convertWeight,
  dateInputToISO,
  getGoalKg,
  getRecordVolume,
  normalizeWorkoutRecord,
  toDateInputValue,
} from "../src/lib/utils.js";
import {
  calculateBMR,
  calculateTDEE,
  getCalorieTarget,
  getProteinTarget,
  getMacroTargets,
  sumDailyMacros,
  getMacroProgress,
  getConsecutiveShortfallDays,
  normalizeMealRecord,
  normalizeNutritionGoal,
  normalizeFavorite,
  isValidImportedMeal,
} from "../src/features/nutrition/utils/nutritionMath.js";

test("calculates expected 1RM for supported formulas", () => {
  assert.equal(calculate1RM(100, 5, "epley"), 116.7);
  assert.equal(calculate1RM(100, 5, "brzycki"), 112.5);
  assert.equal(calculate1RM(100, 1, "brzycki"), 100);
});

test("classifies estimate confidence by repetition range", () => {
  assert.equal(getEstimateConfidence(3).level, "높음");
  assert.equal(getEstimateConfidence(8).level, "보통");
  assert.equal(getEstimateConfidence(12).level, "낮음");
});

test("converts weight units with one decimal precision", () => {
  assert.equal(convertWeight(100, "kg", "lb"), 220.5);
  assert.equal(convertWeight(220.462, "lb", "kg"), 100);
});

test("normalizes records and includes sets in volume", () => {
  const record = normalizeWorkoutRecord({
    exerciseId: "bench-press",
    weight: 100,
    reps: 5,
    sets: 3,
    rm: 116.7,
    unit: "kg",
  });

  assert.equal(record.sets, 3);
  assert.equal(record.rpe, null);
  assert.equal(record.syncVersion, 1);
  assert.ok(record.createdAt);
  assert.ok(record.updatedAt);
  assert.equal(getRecordVolume(record, "kg"), 1500);
});

test("keeps legacy records compatible by defaulting to one set", () => {
  const legacy = normalizeWorkoutRecord({
    exerciseId: "squat",
    weight: 120,
    reps: 5,
    rm: 140,
    unit: "kg",
  });

  assert.equal(legacy.sets, 1);
  assert.equal(getRecordVolume(legacy, "kg"), 600);
});

test("reads legacy and expanded goal shapes", () => {
  assert.equal(getGoalKg(150), 150);
  assert.equal(getGoalKg({ targetKg: 160, targetDate: "2026-12-31" }), 160);
  assert.equal(getGoalKg({ value: 315, unit: "lb" }), 142.9);
});

test("round-trips date input values for workout records", () => {
  const iso = dateInputToISO("2026-06-21");
  assert.equal(toDateInputValue(iso), "2026-06-21");
});

test("validates and normalizes backup payloads", () => {
  const payload = createBackupPayload({
    history: [
      {
        exerciseId: "bench-press",
        weight: 100,
        reps: 5,
        sets: 3,
        rm: 119,
        unit: "kg",
        date: "2026-06-21T12:00:00.000Z",
      },
      {
        exerciseId: "unknown-lift",
        weight: 100,
        reps: 5,
        rm: 120,
      },
    ],
    goals: {
      "bench-press": { targetKg: 140, targetDate: "2026-12-31" },
      "unknown-lift": 200,
    },
    deletedRecords: [
      { id: "deleted-1", deletedAt: "2026-06-21T00:00:00.000Z" },
    ],
    deletedGoals: [
      { id: "deadlift", deletedAt: "2026-06-21T00:00:00.000Z" },
    ],
  });

  const parsed = parseBackupPayload(payload);
  assert.equal(parsed.stats.recordCount, 1);
  assert.equal(parsed.stats.droppedRecords, 1);
  assert.equal(parsed.stats.goalCount, 1);
  assert.equal(parsed.history[0].sets, 3);
  assert.equal(parsed.goals["bench-press"].targetKg, 140);
  assert.equal(parsed.goals["bench-press"].syncVersion, 1);
  assert.equal(parsed.stats.deletedRecordCount, 1);
  assert.equal(parsed.deletedRecords[0].id, "deleted-1");
  assert.equal(parsed.stats.deletedGoalCount, 1);
  assert.equal(parsed.deletedGoals[0].id, "deadlift");
});

test("includes nutrition data in backup payloads and round-trips it", () => {
  const payload = createBackupPayload({
    history: [],
    goals: {},
    meals: [
      { date: "2026-06-21T08:00:00.000Z", mealType: "breakfast", foodName: "닭가슴살", kcal: 200, protein: 30, carbs: 5, fat: 5 },
      { foodName: "unknown food, no kcal" },
    ],
    nutritionGoal: { calorieTarget: 2500, proteinTarget: 160, carbsTarget: 250, fatTarget: 70, mode: "bulk", weightKg: 80 },
    deletedMeals: [{ id: "deleted-meal-1", deletedAt: "2026-06-21T00:00:00.000Z" }],
    favorites: [{ foodName: "닭가슴살 100g", kcal: 165, protein: 31, carbs: 0, fat: 3.6 }],
  });

  const parsed = parseBackupPayload(payload);
  assert.equal(parsed.stats.mealCount, 1);
  assert.equal(parsed.stats.droppedMeals, 1);
  assert.equal(parsed.meals[0].foodName, "닭가슴살");
  assert.equal(parsed.meals[0].mealType, "breakfast");
  assert.equal(parsed.nutritionGoal.calorieTarget, 2500);
  assert.equal(parsed.stats.hasNutritionGoal, true);
  assert.equal(parsed.stats.deletedMealCount, 1);
  assert.equal(parsed.stats.favoriteCount, 1);
  assert.equal(parsed.favorites[0].foodName, "닭가슴살 100g");
});

test("restores legacy backups that predate the nutrition schema", () => {
  const legacyPayload = {
    version: "2.2",
    schema: "1rm-calculator.backup",
    history: [
      { exerciseId: "squat", weight: 120, reps: 5, rm: 140, unit: "kg", date: "2026-06-21T00:00:00.000Z" },
    ],
    goals: {},
  };

  const parsed = parseBackupPayload(legacyPayload);
  assert.equal(parsed.history.length, 1);
  assert.deepEqual(parsed.meals, []);
  assert.equal(parsed.nutritionGoal, null);
  assert.deepEqual(parsed.deletedMeals, []);
  assert.deepEqual(parsed.favorites, []);
  assert.equal(parsed.stats.mealCount, 0);
  assert.equal(parsed.stats.hasNutritionGoal, false);
});

test("rejects backup payloads without valid importable data", () => {
  assert.throws(
    () => parseBackupPayload({ history: [{ exerciseId: "bad" }], goals: {} }),
    /가져올 수 있는/
  );
});

test("calculates goal weekly gain from target date", () => {
  const plan = getGoalPlan(
    { targetKg: 140, targetDate: "2026-07-19" },
    120,
    "kg",
    new Date("2026-06-21T00:00:00")
  );

  assert.equal(plan.status, "active");
  assert.equal(plan.daysLeft, 28);
  assert.equal(plan.remaining, 20);
  assert.equal(plan.weeklyGain, 5);
});

test("classifies achieved and overdue goals", () => {
  assert.equal(getGoalPlan({ targetKg: 140, targetDate: "2026-07-19" }, 142, "kg").status, "done");
  assert.equal(
    getGoalPlan(
      { targetKg: 140, targetDate: "2026-06-01" },
      120,
      "kg",
      new Date("2026-06-21T00:00:00")
    ).status,
    "overdue"
  );
});

test("picks latest sync entity by updatedAt and syncVersion", () => {
  const local = { id: "a", updatedAt: "2026-06-21T00:00:00.000Z", syncVersion: 1, value: "local" };
  const remote = { id: "a", updatedAt: "2026-06-22T00:00:00.000Z", syncVersion: 1, value: "remote" };
  assert.equal(pickLatestEntity(local, remote).value, "remote");

  const sameTimeLocal = { id: "b", updatedAt: "2026-06-21T00:00:00.000Z", syncVersion: 2, value: "local" };
  const sameTimeRemote = { id: "b", updatedAt: "2026-06-21T00:00:00.000Z", syncVersion: 3, value: "remote" };
  assert.equal(pickLatestEntity(sameTimeLocal, sameTimeRemote).value, "remote");
});

test("merges record lists and goal maps for future account sync", () => {
  const records = mergeEntityList(
    [{ id: "a", updatedAt: "2026-06-20T00:00:00.000Z", value: 1 }],
    [
      { id: "a", updatedAt: "2026-06-21T00:00:00.000Z", value: 2 },
      { id: "b", updatedAt: "2026-06-19T00:00:00.000Z", value: 3 },
    ]
  );
  assert.equal(records.length, 2);
  assert.equal(records.find((record) => record.id === "a").value, 2);

  const goals = mergeGoalMaps(
    { "bench-press": { updatedAt: "2026-06-20T00:00:00.000Z", targetKg: 130 } },
    { "bench-press": { updatedAt: "2026-06-21T00:00:00.000Z", targetKg: 140 } }
  );
  assert.equal(goals["bench-press"].targetKg, 140);
});

test("merges tombstones and filters deleted records by updatedAt", () => {
  const deleted = mergeDeletedEntities(
    [{ id: "a", deletedAt: "2026-06-21T00:00:00.000Z", syncVersion: 2 }],
    [{ id: "a", deletedAt: "2026-06-20T00:00:00.000Z", syncVersion: 1 }]
  );
  assert.equal(deleted.length, 1);
  assert.equal(deleted[0].syncVersion, 2);

  const records = applyDeletedEntities(
    [
      { id: "a", updatedAt: "2026-06-20T00:00:00.000Z" },
      { id: "b", updatedAt: "2026-06-22T00:00:00.000Z" },
    ],
    deleted
  );
  assert.deepEqual(records.map((record) => record.id), ["b"]);
});

test("drops obsolete tombstones when a record is newer than deletion", () => {
  const tombstones = [
    { id: "a", deletedAt: "2026-06-20T00:00:00.000Z" },
    { id: "b", deletedAt: "2026-06-22T00:00:00.000Z" },
  ];

  const active = pruneObsoleteDeletedEntities(
    [
      { id: "a", updatedAt: "2026-06-21T00:00:00.000Z" },
      { id: "b", updatedAt: "2026-06-21T00:00:00.000Z" },
    ],
    tombstones
  );

  assert.deepEqual(active.map((tombstone) => tombstone.id), ["b"]);
});

test("applies deleted goal tombstones without reviving stale remote goals", () => {
  const goals = {
    "bench-press": { targetKg: 140, updatedAt: "2026-06-20T00:00:00.000Z" },
    squat: { targetKg: 180, updatedAt: "2026-06-23T00:00:00.000Z" },
  };
  const tombstones = [
    { id: "bench-press", deletedAt: "2026-06-21T00:00:00.000Z" },
    { id: "squat", deletedAt: "2026-06-22T00:00:00.000Z" },
  ];
  const activeGoals = applyDeletedEntitiesToMap(goals, tombstones);

  assert.deepEqual(Object.keys(activeGoals), ["squat"]);
  assert.deepEqual(
    pruneObsoleteDeletedEntitiesFromMap(activeGoals, tombstones).map((item) => item.id),
    ["bench-press"]
  );
});

test("detects local and configured sync modes from environment", () => {
  const local = getSyncStatus({});
  assert.equal(local.mode, "local");
  assert.equal(local.configured, false);
  assert.ok(local.missing.includes("VITE_FIREBASE_API_KEY"));

  const readyEnv = {
    VITE_FIREBASE_API_KEY: "AIzaSyD123456789012345678901234567890123",
    VITE_FIREBASE_PROJECT_ID: "project-123",
    VITE_FIREBASE_AUTH_DOMAIN: "project-123.firebaseapp.com",
    VITE_FIREBASE_APP_ID: "1:123456789:web:abcdef123456",
  };
  const ready = getSyncStatus(readyEnv);
  assert.equal(ready.mode, "ready");
  assert.equal(ready.configured, true);
  assert.deepEqual(ready.missing, []);
  assert.deepEqual(ready.invalid, []);
  assert.equal(getFirebaseConfig(readyEnv).projectId, "project-123");

  const mixedProjectEnv = {
    ...readyEnv,
    VITE_FIREBASE_AUTH_DOMAIN: "other-project.firebaseapp.com",
    VITE_FIREBASE_STORAGE_BUCKET: "other-project.appspot.com",
    VITE_FIREBASE_MESSAGING_SENDER_ID: "987654321",
  };
  const audit = auditFirebaseEnvConsistency(mixedProjectEnv);
  assert.equal(audit.valid, false);
  assert.deepEqual(
    audit.issues.map((issue) => issue.key),
    [
      "VITE_FIREBASE_AUTH_DOMAIN",
      "VITE_FIREBASE_STORAGE_BUCKET",
      "VITE_FIREBASE_MESSAGING_SENDER_ID",
    ]
  );
  assert.equal(getSyncStatus(mixedProjectEnv).configured, false);
});

test("requires Firebase environment only for release-gated env checks", () => {
  assert.equal(auditFirebaseEnvConsistency({}).valid, true);
  const required = auditFirebaseEnvConsistency({}, { requireConfigured: true });
  assert.equal(required.valid, false);
  assert.deepEqual(required.issues.map((issue) => issue.type), ["missing", "missing", "missing", "missing"]);
});

test("formats persisted sync feedback for profile status", () => {
  assert.deepEqual(
    normalizeSyncStats({ recordCount: "3", goalCount: 2, deletedRecordCount: -1, deletedGoalCount: 1 }),
    { recordCount: 3, goalCount: 2, deletedRecordCount: 0, deletedGoalCount: 1 }
  );
  assert.equal(
    getSyncSummary({ recordCount: 3, goalCount: 2, deletedRecordCount: 1, deletedGoalCount: 1 }),
    "3개 기록 · 목표 2개 · 기록 삭제 반영 1개 · 목표 삭제 반영 1개"
  );
  assert.equal(isValidSyncTime("2026-06-22T00:00:00.000Z"), true);
  assert.equal(isValidSyncTime("not-a-date"), false);
});

test("describes PWA offline and update states", () => {
  assert.equal(getPWAStatusCopy({ online: true, needRefresh: false }), null);
  assert.equal(getPWAStatusCopy({ online: false, needRefresh: false }).tone, "offline");
  assert.equal(getPWAStatusCopy({ online: false, needRefresh: true }).tone, "update");
});

test("defines user-facing privacy sections", () => {
  assert.ok(PRIVACY_SECTIONS.length >= 5);
  assert.ok(PRIVACY_SECTIONS.every((section) => section.title && section.items.length >= 3));
  assert.ok(getPrivacySummary().includes("저장하는 데이터"));
  assert.ok(getPrivacySummary().includes("사용자 제어"));
  assert.ok(getPrivacySummary().includes("삭제 요청 범위"));
});

test("defines first-run onboarding copy for empty states", () => {
  assert.equal(ONBOARDING_STEPS.length, 3);
  assert.equal(getEmptyDashboardCopy().action, "1RM 계산하기");
  assert.ok(getEmptyDashboardCopy().steps.some((step) => step.title === "목표 설정"));
  assert.equal(getEmptyAnalyticsCopy("7일").title, "7일에 분석할 기록이 없습니다");
  assert.equal(getEmptyAnalyticsCopy("전체").action, "기록하러 가기");
});

test("evaluates release readiness from env and required checks", () => {
  assert.ok(RELEASE_CHECKLIST.every((item) => item.id && item.label && item.evidence));
  assert.ok(RELEASE_CHECKLIST.some((item) => item.id === "release-preflight"));
  assert.ok(RELEASE_CHECKLIST.some((item) => item.id === "performance-budget"));
  assert.ok(RELEASE_CHECKLIST.some((item) => item.id === "ci"));
  assert.ok(FIREBASE_ENV_GUIDE.every((item) => item.key && item.source && item.purpose));
  assert.ok(FIREBASE_ENV_GUIDE.some((item) => item.key === "VITE_SUPPORT_EMAIL" && item.required));
  assert.ok(RELEASE_SETUP_STEPS.some((step) => step.includes("Google 로그인")));
  assert.ok(RELEASE_SETUP_STEPS.some((step) => step.includes("CI 브라우저 QA")));
  assert.deepEqual(
    getMissingFirebaseEnv({ VITE_FIREBASE_API_KEY: "key" }),
    ["VITE_FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_PROJECT_ID", "VITE_FIREBASE_APP_ID"]
  );
  assert.deepEqual(
    getInvalidFirebaseEnv({
      VITE_FIREBASE_API_KEY: "key",
      VITE_FIREBASE_AUTH_DOMAIN: "https://example.firebaseapp.com",
      VITE_FIREBASE_PROJECT_ID: "Project",
      VITE_FIREBASE_APP_ID: "app",
    }).map((item) => item.key),
    [
      "VITE_FIREBASE_API_KEY",
      "VITE_FIREBASE_AUTH_DOMAIN",
      "VITE_FIREBASE_PROJECT_ID",
      "VITE_FIREBASE_APP_ID",
    ]
  );

  const env = {
    VITE_FIREBASE_API_KEY: "AIzaSyD123456789012345678901234567890123",
    VITE_FIREBASE_PROJECT_ID: "project-123",
    VITE_FIREBASE_AUTH_DOMAIN: "project-123.firebaseapp.com",
    VITE_FIREBASE_APP_ID: "1:123456789:web:abcdef123456",
    VITE_SUPPORT_EMAIL: "support@example.com",
  };
  const ready = getReleaseReadiness({
    env,
    checks: {
      "release-preflight": true,
      build: true,
      "logic-tests": true,
      "firestore-rules": true,
      "browser-qa": true,
      "performance-budget": true,
      ci: true,
      privacy: true,
    },
  });

  assert.equal(ready.ready, true);
  assert.equal(ready.passedRequired, ready.totalRequired);
  assert.equal(getFirebaseEnvReadiness(env).find((item) => item.key === "VITE_FIREBASE_PROJECT_ID").configured, true);
  assert.equal(getFirebaseEnvReadiness({}).find((item) => item.key === "VITE_FIREBASE_PROJECT_ID").configured, false);
  assert.equal(
    getReleaseReadiness({
      env: { ...env, VITE_FIREBASE_APP_ID: "app" },
      checks: {
        "release-preflight": true,
        build: true,
        "logic-tests": true,
        "firestore-rules": true,
        "browser-qa": true,
        "performance-budget": true,
        ci: true,
        privacy: true,
      },
    }).ready,
    false
  );
  assert.equal(getFirebaseEnvReadiness({ VITE_SUPPORT_EMAIL: "bad-email" }).find((item) => item.key === "VITE_SUPPORT_EMAIL").invalid, true);
  assert.equal(getReadinessStatusLabel(ready), "출시 가능");
  assert.equal(getReadinessStatusLabel({ ready: false, passedRequired: 2, totalRequired: 10 }), "2/10 확인");
  assert.equal(getReadinessStatusLabel({ ready: false, passedRequired: 0, totalRequired: 10 }), "준비 필요");
});

test("builds support contact and account deletion request copy", () => {
  const missing = getDeletionRequestCopy(getSupportConfig({}));
  assert.equal(missing.href, "");
  assert.equal(missing.actionLabel, "문의 채널 준비 필요");

  const invalid = getDeletionRequestCopy(getSupportConfig({
    VITE_SUPPORT_EMAIL: "support",
  }));
  assert.equal(invalid.href, "");
  assert.equal(invalid.actionLabel, "문의 채널 준비 필요");

  const configured = getDeletionRequestCopy(getSupportConfig({
    VITE_SUPPORT_EMAIL: "support@example.com",
  }));
  assert.equal(configured.actionLabel, "삭제 요청 메일 작성");
  assert.ok(configured.message.includes("support@example.com"));
  assert.ok(configured.message.includes("deletedGoals"));
  assert.ok(configured.href.startsWith("mailto:support@example.com"));
  assert.ok(decodeURIComponent(configured.href).includes("Firebase Auth 이메일 또는 uid"));
  assert.ok(decodeURIComponent(configured.href).includes("users/{uid}/workoutRecords"));
});

test("defines account data deletion scope for operations", () => {
  assert.deepEqual(getRemoteDeletionScope(), [
    "users/{uid}/workoutRecords",
    "users/{uid}/deletedWorkoutRecords",
    "users/{uid}/goals",
    "users/{uid}/deletedGoals",
  ]);
  assert.ok(getLocalDeletionScope().includes("1rm-workout"));
  assert.ok(ACCOUNT_DELETION_STEPS.some((step) => step.includes("Firebase Auth")));
  assert.ok(getAccountDeletionRequestBody().includes("users/{uid}/deletedGoals"));
});

test("normalizes and summarizes local diagnostic events", () => {
  const first = normalizeDiagnosticEvent({
    id: "e1",
    type: "runtime",
    message: "boom",
    source: "test",
    createdAt: "2026-06-22T00:00:00.000Z",
  });
  assert.equal(first.message, "boom");
  assert.equal(getDiagnosticsSummary([]), "최근 오류 없음");

  const events = mergeDiagnosticEvents([], first);
  assert.equal(events.length, 1);
  assert.equal(getDiagnosticsSummary(events), "최근 오류 1건");
  assert.equal(mergeDiagnosticEvents(events, first).length, 1);

  const many = Array.from({ length: 25 }, (_, index) => ({ id: `e${index}`, message: `m${index}` }))
    .reduce((list, event) => mergeDiagnosticEvents(list, event), []);
  assert.equal(many.length, 20);
});

test("creates a support-safe diagnostics package", () => {
  const payload = createDiagnosticsPayload({
    appVersion: "2.0.0",
    events: [
      {
        id: "e1",
        type: "runtime",
        message: "boom",
        source: "window",
        createdAt: "2026-06-22T00:00:00.000Z",
      },
    ],
    syncStatus: {
      provider: "firebase",
      mode: "local",
      configured: false,
      missing: ["VITE_FIREBASE_API_KEY"],
      invalid: [],
      issues: [{ key: "VITE_FIREBASE_API_KEY", type: "missing", message: "secret" }],
    },
    runtime: {
      userAgent: "test-browser",
      language: "ko-KR",
      online: true,
      path: "/diagnostics",
    },
    now: "2026-06-22T01:00:00.000Z",
  });

  assert.equal(payload.app.name, "1rm-calculator");
  assert.equal(payload.app.version, "2.0.0");
  assert.equal(payload.runtime.userAgent, "test-browser");
  assert.equal(payload.sync.missingKeys[0], "VITE_FIREBASE_API_KEY");
  assert.deepEqual(payload.sync.issueTypes, [{ key: "VITE_FIREBASE_API_KEY", type: "missing" }]);
  assert.equal(payload.events[0].message, "boom");
  assert.equal(serializeDiagnosticsPayload(payload).includes("secret"), false);

  const missingSupport = getDiagnosticsSupportCopy({ support: {}, payload });
  assert.equal(missingSupport.href, "");
  assert.equal(missingSupport.actionLabel, "지원 메일 준비 필요");

  const configuredSupport = getDiagnosticsSupportCopy({
    support: { configured: true, email: "support@example.com" },
    payload,
  });
  assert.ok(configuredSupport.href.startsWith("mailto:support@example.com"));
  assert.ok(decodeURIComponent(configuredSupport.href).includes("진단 정보"));
  assert.ok(decodeURIComponent(configuredSupport.href).includes("test-browser"));
});

test("models Firestore owner-scoped access rules", () => {
  assert.deepEqual(parseUserScopedPath("users/u1/workoutRecords/r1"), {
    uid: "u1",
    collection: "workoutRecords",
    documentId: "r1",
    valid: true,
  });
  assert.equal(canAccessFirestorePath({ authUid: "u1", path: "users/u1/workoutRecords/r1" }), true);
  assert.equal(canAccessFirestorePath({ authUid: "u1", path: "users/u1/deletedWorkoutRecords/r1" }), true);
  assert.equal(canAccessFirestorePath({ authUid: "u1", path: "users/u1/goals/bench-press" }), true);
  assert.equal(canAccessFirestorePath({ authUid: "u1", path: "users/u1/deletedGoals/bench-press" }), true);
  assert.equal(canAccessFirestorePath({ authUid: "u2", path: "users/u1/workoutRecords/r1" }), false);
  assert.equal(canAccessFirestorePath({ authUid: "", path: "users/u1/workoutRecords/r1" }), false);
  assert.equal(canAccessFirestorePath({ authUid: "u1", path: "users/u1/privateNotes/n1" }), false);
  assert.equal(canAccessFirestorePath({ authUid: "u1", path: "publicStats/u1" }), false);
});

test("audits firestore.rules against the app schema contract", () => {
  const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
  const audit = auditFirestoreRules(rules);
  assert.deepEqual(audit.issues, []);
  assert.equal(audit.valid, true);

  const weakened = rules.replace("allow write: if false;", "allow write: if isOwner(uid);");
  assert.equal(auditFirestoreRules(weakened).valid, false);

  const missingField = rules.replace('"syncVersion",', "");
  assert.equal(auditFirestoreRules(missingField).valid, false);
});

test("validates Firestore write document shapes", () => {
  const workout = {
    id: "r1",
    exerciseId: "bench-press",
    weight: 100,
    weightKg: 100,
    reps: 5,
    sets: 3,
    rm: 119,
    rmKg: 119,
    unit: "kg",
    formula: "mayhew",
    rpe: 8,
    notes: "top set",
    date: "2026-06-22T00:00:00.000Z",
    createdAt: "2026-06-22T00:00:00.000Z",
    updatedAt: "2026-06-22T00:00:00.000Z",
    syncVersion: 1,
  };

  assert.equal(isValidWorkoutRecordDocument(workout, "r1"), true);
  assert.equal(isValidWorkoutRecordDocument({ ...workout, id: "other" }, "r1"), false);
  assert.equal(isValidWorkoutRecordDocument({ ...workout, sets: 0 }, "r1"), false);
  assert.equal(isValidWorkoutRecordDocument({ ...workout, rpe: 11 }, "r1"), false);
  assert.equal(isValidWorkoutRecordDocument({ ...workout, ownerUid: "u1" }, "r1"), false);
  assert.equal(
    canWriteFirestorePath({ authUid: "u1", path: "users/u1/workoutRecords/r1", data: workout }),
    true
  );
  assert.equal(
    canWriteFirestorePath({ authUid: "u2", path: "users/u1/workoutRecords/r1", data: workout }),
    false
  );

  const deleted = {
    id: "r1",
    deletedAt: "2026-06-22T00:00:00.000Z",
    updatedAt: "2026-06-22T00:00:00.000Z",
    syncVersion: 2,
  };
  assert.equal(isValidDeletedRecordDocument(deleted, "r1"), true);
  assert.equal(isValidDeletedRecordDocument({ ...deleted, reason: "manual" }, "r1"), false);
  assert.equal(
    canWriteFirestorePath({ authUid: "u1", path: "users/u1/deletedGoals/bench-press", data: { ...deleted, id: "bench-press" } }),
    true
  );

  const goal = {
    targetKg: 140,
    targetDate: "2026-07-19",
    createdAt: "2026-06-22T00:00:00.000Z",
    updatedAt: "2026-06-22T00:00:00.000Z",
    syncVersion: 1,
  };
  assert.equal(isValidGoalDocument(goal), true);
  assert.equal(isValidGoalDocument({ ...goal, id: "bench-press" }), false);
  assert.equal(isValidGoalDocument({ ...goal, targetKg: 0 }), false);
});

test("serializes Firestore payloads to the production schema", () => {
  const workout = toFirestoreWorkoutRecord({
    id: "r1",
    exerciseId: "bench-press",
    weight: 100,
    weightKg: 100,
    reps: 5,
    sets: 3,
    rm: 119,
    rmKg: 119,
    unit: "kg",
    formula: "mayhew",
    rpe: 8,
    notes: "top set",
    date: "2026-06-22T00:00:00.000Z",
    createdAt: "2026-06-22T00:00:00.000Z",
    updatedAt: "2026-06-22T00:00:00.000Z",
    syncVersion: 1,
    internalOnly: true,
  });
  assert.equal(workout.internalOnly, undefined);
  assert.equal(isValidWorkoutRecordDocument(workout, "r1"), true);

  const goal = toFirestoreGoal({
    id: "bench-press",
    targetKg: 140,
    targetDate: "2026-07-19",
    updatedAt: "2026-06-22T00:00:00.000Z",
  });
  assert.equal(goal.id, undefined);
  assert.equal(goal.createdAt, "2026-06-22T00:00:00.000Z");
  assert.equal(isValidGoalDocument(goal), true);

  const deleted = toFirestoreDeletedRecord({
    id: "r1",
    deletedAt: "2026-06-22T00:00:00.000Z",
    updatedAt: "2026-06-22T00:00:00.000Z",
    syncVersion: 2,
    reason: "manual",
  });
  assert.equal(deleted.reason, undefined);
  assert.equal(isValidDeletedRecordDocument(deleted, "r1"), true);
});

test("estimates BMR with the Mifflin-St Jeor formula by gender", () => {
  assert.equal(calculateBMR({ weightKg: 80, heightCm: 180, age: 30, gender: "male" }), 1780);
  assert.equal(calculateBMR({ weightKg: 60, heightCm: 165, age: 25, gender: "female" }), 1345);
  assert.equal(calculateBMR({ weightKg: 0 }), null);
});

test("scales BMR to TDEE by activity level", () => {
  assert.equal(calculateTDEE(1780, "moderate"), 2759);
  assert.equal(calculateTDEE(null), null);
});

test("adjusts calorie target by goal mode", () => {
  assert.equal(getCalorieTarget(2759, "bulk"), 3173);
  assert.equal(getCalorieTarget(2759, "cut"), 2207);
  assert.equal(getCalorieTarget(2759, "maintain"), 2759);
});

test("derives protein target from body weight and goal mode", () => {
  assert.equal(getProteinTarget(80, "bulk"), 160);
  assert.equal(getProteinTarget(80, "maintain"), 144);
  assert.equal(getProteinTarget(0, "bulk"), null);
});

test("computes full macro target set with carbs filling remaining calories", () => {
  const targets = getMacroTargets({
    weightKg: 80,
    heightCm: 180,
    age: 30,
    gender: "male",
    activityLevel: "moderate",
    goalMode: "bulk",
  });
  assert.equal(targets.bmr, 1780);
  assert.equal(targets.tdee, 2759);
  assert.equal(targets.calorieTarget, 3173);
  assert.equal(targets.proteinTarget, 160);
  assert.equal(targets.fatTarget, 88);
  assert.equal(targets.carbsTarget, 435);
});

test("sums daily macro totals from meal records", () => {
  const totals = sumDailyMacros([
    { kcal: 500, protein: 30, carbs: 50, fat: 10 },
    { kcal: 300, protein: 20, carbs: 20, fat: 5 },
  ]);
  assert.deepEqual(totals, { kcal: 800, protein: 50, carbs: 70, fat: 15 });
});

test("clamps macro progress percentage to 0-100", () => {
  assert.equal(getMacroProgress(120, 150), 80);
  assert.equal(getMacroProgress(200, 150), 100);
  assert.equal(getMacroProgress(50, 0), 0);
});

test("normalizes meal records with defaults and clamped fields", () => {
  const meal = normalizeMealRecord({ foodName: "  닭가슴살  ", kcal: -5, mealType: "brunch" });
  assert.equal(meal.foodName, "닭가슴살");
  assert.equal(meal.kcal, 0);
  assert.equal(meal.mealType, "snack");
  assert.equal(meal.unit, "g");
  assert.equal(meal.syncVersion, 1);
  assert.ok(meal.id);
  assert.ok(meal.createdAt);
});

test("validates importable meal shape before normalizing", () => {
  assert.equal(isValidImportedMeal({ foodName: "닭가슴살", kcal: 200 }), true);
  assert.equal(isValidImportedMeal({ foodName: "", kcal: 200 }), false);
  assert.equal(isValidImportedMeal({ foodName: "닭가슴살", kcal: -1 }), false);
  assert.equal(isValidImportedMeal({ foodName: "닭가슴살", kcal: 200, date: "not-a-date" }), false);
});

test("normalizes nutrition goals and rejects incomplete ones", () => {
  const goal = normalizeNutritionGoal({ calorieTarget: 2500, proteinTarget: 160, mode: "bulk" });
  assert.equal(goal.calorieTarget, 2500);
  assert.equal(goal.mode, "bulk");
  assert.equal(goal.syncVersion, 1);
  assert.equal(normalizeNutritionGoal({ calorieTarget: 2500 }), null);
  assert.equal(normalizeNutritionGoal(null), null);
});

test("normalizes favorite food shortcuts", () => {
  const favorite = normalizeFavorite({ foodName: "닭가슴살 100g", kcal: 165, protein: 31 });
  assert.equal(favorite.foodName, "닭가슴살 100g");
  assert.equal(favorite.kcal, 165);
  assert.equal(favorite.carbs, 0);
  assert.ok(favorite.id);
});

test("counts consecutive days under a macro target from most recent", () => {
  const days = [
    { date: "d3", protein: 100 },
    { date: "d2", protein: 90 },
    { date: "d1", protein: 150 },
  ];
  assert.equal(getConsecutiveShortfallDays(days, 140), 2);
  assert.equal(getConsecutiveShortfallDays(days, 0), 0);
});

test("sync service writes merged data and prunes stale tombstones", async () => {
  const operations = [];
  const db = {
    collections: {
      "users/user-1/workoutRecords": [
        {
          id: "b",
          exerciseId: "bench-press",
          weight: 90,
          reps: 5,
          rm: 105,
          unit: "kg",
          date: "2026-06-20T00:00:00.000Z",
          createdAt: "2026-06-20T00:00:00.000Z",
          updatedAt: "2026-06-20T00:00:00.000Z",
        },
      ],
      "users/user-1/goals": [
        {
          id: "bench-press",
          targetKg: 140,
          updatedAt: "2026-06-21T00:00:00.000Z",
        },
      ],
      "users/user-1/deletedWorkoutRecords": [
        { id: "a", deletedAt: "2026-06-21T00:00:00.000Z" },
        { id: "b", deletedAt: "2026-06-22T00:00:00.000Z" },
      ],
      "users/user-1/deletedGoals": [
        { id: "bench-press", deletedAt: "2026-06-22T00:00:00.000Z" },
      ],
    },
  };
  const services = {
    configured: true,
    db,
    firestoreApi: {
      collection: (_db, path) => ({ path }),
      doc: (_db, path, id) => ({ path: `${path}/${id}` }),
      getDocs: async (ref) => ({
        docs: (db.collections[ref.path] || []).map((item) => ({
          id: item.id,
          data: () => {
            const { id, ...data } = item;
            return data;
          },
        })),
      }),
      writeBatch: () => ({
        set: (ref, data, options) => operations.push({ type: "set", path: ref.path, data, options }),
        delete: (ref) => operations.push({ type: "delete", path: ref.path }),
        commit: async () => operations.push({ type: "commit" }),
      }),
    },
  };

  const result = await syncUserDataWithServices(
    {
      uid: "user-1",
      history: [
        {
          id: "a",
          exerciseId: "bench-press",
          weight: 100,
          reps: 5,
          rm: 119,
          unit: "kg",
          date: "2026-06-22T00:00:00.000Z",
          createdAt: "2026-06-22T00:00:00.000Z",
          updatedAt: "2026-06-22T00:00:00.000Z",
        },
      ],
      goals: {},
      deletedRecords: [],
      deletedGoals: [],
    },
    services
  );

  assert.deepEqual(result.history.map((record) => record.id), ["a"]);
  assert.deepEqual(Object.keys(result.goals), []);
  assert.deepEqual(result.deletedRecords.map((record) => record.id), ["b"]);
  assert.deepEqual(result.deletedGoals.map((record) => record.id), ["bench-press"]);
  assert.ok(operations.some((op) => op.type === "set" && op.path === "users/user-1/workoutRecords/a"));
  assert.ok(
    operations.every((op) => op.type !== "set" || !Object.hasOwn(op.data, "internalOnly"))
  );
  assert.ok(
    operations
      .filter((op) => op.type === "set" && op.path === "users/user-1/goals/bench-press")
      .every((op) => !Object.hasOwn(op.data, "id") && Object.hasOwn(op.data, "createdAt"))
  );
  assert.ok(operations.some((op) => op.type === "delete" && op.path === "users/user-1/workoutRecords/b"));
  assert.ok(operations.some((op) => op.type === "delete" && op.path === "users/user-1/deletedWorkoutRecords/a"));
  assert.ok(operations.some((op) => op.type === "set" && op.path === "users/user-1/deletedGoals/bench-press"));
  assert.ok(operations.some((op) => op.type === "delete" && op.path === "users/user-1/goals/bench-press"));
  assert.equal(
    operations.some((op) => op.type === "delete" && op.path === "users/user-1/workoutRecords/a"),
    false
  );
});
