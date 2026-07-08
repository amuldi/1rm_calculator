import { EXERCISE_MAP } from "../constants/exercises.js";
import { mergeDeletedEntities } from "./syncModel.js";
import { getGoalKg, normalizeWorkoutRecord } from "./utils.js";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidDate(value) {
  return !Number.isNaN(new Date(value).getTime());
}

function normalizeImportRecord(record) {
  if (!isPlainObject(record)) return null;
  if (!record.exerciseId || !EXERCISE_MAP[record.exerciseId]) return null;

  const weight = Number(record.weight ?? record.weightKg);
  const reps = Number(record.reps);
  const rm = Number(record.rm ?? record.rmKg);
  if (!Number.isFinite(weight) || weight <= 0) return null;
  if (!Number.isFinite(reps) || reps < 1 || reps > 30) return null;
  if (!Number.isFinite(rm) || rm <= 0) return null;
  if (record.date && !isValidDate(record.date)) return null;

  return normalizeWorkoutRecord(record);
}

function normalizeImportGoals(goals) {
  if (!isPlainObject(goals)) return {};
  return Object.entries(goals).reduce((next, [exerciseId, goal]) => {
    if (!EXERCISE_MAP[exerciseId]) return next;
    const targetKg = getGoalKg(goal);
    if (!targetKg || targetKg <= 0) return next;
    const targetDate = isPlainObject(goal) && typeof goal.targetDate === "string" ? goal.targetDate : "";
    const now = new Date().toISOString();
    next[exerciseId] = {
      targetKg,
      targetDate,
      createdAt: isPlainObject(goal) && typeof goal.createdAt === "string" ? goal.createdAt : now,
      updatedAt: isPlainObject(goal) && typeof goal.updatedAt === "string" ? goal.updatedAt : now,
      syncVersion: isPlainObject(goal) && Number.isFinite(Number(goal.syncVersion))
        ? Math.max(1, Math.round(Number(goal.syncVersion)))
        : 1,
    };
    return next;
  }, {});
}

export function createBackupPayload({ history = [], goals = {}, deletedRecords = [], deletedGoals = [] } = {}) {
  return {
    version: "2.2",
    schema: "1rm-calculator.backup",
    exportedAt: new Date().toISOString(),
    history,
    goals,
    deletedRecords,
    deletedGoals,
  };
}

export function parseBackupPayload(payload) {
  if (!isPlainObject(payload)) {
    throw new Error("백업 파일의 최상위 형식이 올바르지 않습니다.");
  }

  const rawHistory = Array.isArray(payload.history) ? payload.history : [];
  const history = rawHistory.map(normalizeImportRecord).filter(Boolean);
  const goals = normalizeImportGoals(payload.goals);
  const deletedRecords = mergeDeletedEntities(
    Array.isArray(payload.deletedRecords) ? payload.deletedRecords : [],
    []
  );
  const deletedGoals = mergeDeletedEntities(
    Array.isArray(payload.deletedGoals) ? payload.deletedGoals : [],
    []
  );
  const droppedRecords = rawHistory.length - history.length;
  const goalCount = Object.keys(goals).length;

  if (!history.length && !goalCount) {
    throw new Error("가져올 수 있는 운동 기록이나 목표가 없습니다.");
  }

  return {
    history,
    goals,
    deletedRecords,
    deletedGoals,
    stats: {
      recordCount: history.length,
      goalCount,
      deletedRecordCount: deletedRecords.length,
      deletedGoalCount: deletedGoals.length,
      droppedRecords,
    },
  };
}
