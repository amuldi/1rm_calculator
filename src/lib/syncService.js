import { getFirebaseFirestoreServices } from "./firebaseClient.js";
import {
  applyDeletedEntities,
  applyDeletedEntitiesToMap,
  mergeDeletedEntities,
  mergeEntityList,
  mergeGoalMaps,
  pruneObsoleteDeletedEntities,
  pruneObsoleteDeletedEntitiesFromMap,
} from "./syncModel.js";
import { normalizeWorkoutRecord } from "./utils.js";

function userPath(uid, child) {
  return `users/${uid}/${child}`;
}

async function readCollection(firestoreApi, db, path) {
  const snapshot = await firestoreApi.getDocs(firestoreApi.collection(db, path));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

function stripUndefined(value) {
  return Object.entries(value).reduce((next, [key, entry]) => {
    if (entry !== undefined) next[key] = entry;
    return next;
  }, {});
}

function pickFields(value, fields) {
  return stripUndefined(
    fields.reduce((next, field) => {
      next[field] = value?.[field];
      return next;
    }, {})
  );
}

export function toFirestoreWorkoutRecord(record) {
  return pickFields(normalizeWorkoutRecord(record), [
    "id",
    "exerciseId",
    "weight",
    "weightKg",
    "reps",
    "sets",
    "rm",
    "rmKg",
    "unit",
    "formula",
    "rpe",
    "notes",
    "date",
    "createdAt",
    "updatedAt",
    "syncVersion",
  ]);
}

export function toFirestoreGoal(goal) {
  const now = new Date().toISOString();
  const targetKg = Number(goal?.targetKg);
  return stripUndefined({
    targetKg: Number.isFinite(targetKg) && targetKg > 0 ? targetKg : undefined,
    targetDate: typeof goal?.targetDate === "string" ? goal.targetDate : "",
    createdAt: goal?.createdAt || goal?.updatedAt || now,
    updatedAt: goal?.updatedAt || goal?.createdAt || now,
    syncVersion: Math.max(1, Math.round(Number(goal?.syncVersion) || 1)),
  });
}

export function toFirestoreDeletedRecord(tombstone) {
  return pickFields(tombstone, [
    "id",
    "deletedAt",
    "updatedAt",
    "syncVersion",
  ]);
}

export async function syncUserDataWithServices(
  { uid, history = [], goals = {}, deletedRecords = [], deletedGoals = [] },
  services
) {
  if (!services.configured || !services.db) {
    throw new Error("Firebase 환경 설정이 없어 동기화할 수 없습니다.");
  }
  if (!uid) throw new Error("로그인 사용자 정보가 없습니다.");

  const db = services.db;
  const [remoteRecords, remoteGoalDocs, remoteDeletedRecords, remoteDeletedGoals] = await Promise.all([
    readCollection(services.firestoreApi, db, userPath(uid, "workoutRecords")),
    readCollection(services.firestoreApi, db, userPath(uid, "goals")),
    readCollection(services.firestoreApi, db, userPath(uid, "deletedWorkoutRecords")),
    readCollection(services.firestoreApi, db, userPath(uid, "deletedGoals")),
  ]);

  const localRecords = history.map((record) => normalizeWorkoutRecord(record));
  const mergedDeletedRecords = mergeDeletedEntities(deletedRecords, remoteDeletedRecords);
  const mergedRecordCandidates = mergeEntityList(localRecords, remoteRecords);
  const mergedRecords = applyDeletedEntities(
    mergedRecordCandidates,
    mergedDeletedRecords
  ).map((record) => normalizeWorkoutRecord(record));
  const activeDeletedRecords = pruneObsoleteDeletedEntities(mergedRecords, mergedDeletedRecords);
  const staleDeletedRecords = mergedDeletedRecords.filter(
    (deleted) => !activeDeletedRecords.some((active) => active.id === deleted.id)
  );
  const remoteGoals = remoteGoalDocs.reduce((next, goal) => {
    next[goal.id] = goal;
    return next;
  }, {});
  const mergedDeletedGoals = mergeDeletedEntities(deletedGoals, remoteDeletedGoals);
  const mergedGoalCandidates = mergeGoalMaps(goals, remoteGoals);
  const mergedGoals = applyDeletedEntitiesToMap(mergedGoalCandidates, mergedDeletedGoals);
  const activeDeletedGoals = pruneObsoleteDeletedEntitiesFromMap(mergedGoals, mergedDeletedGoals);
  const staleDeletedGoals = mergedDeletedGoals.filter(
    (deleted) => !activeDeletedGoals.some((active) => active.id === deleted.id)
  );

  const batch = services.firestoreApi.writeBatch(db);
  for (const record of mergedRecords) {
    batch.set(
      services.firestoreApi.doc(db, userPath(uid, "workoutRecords"), record.id),
      toFirestoreWorkoutRecord(record),
      { merge: true }
    );
  }
  for (const [exerciseId, goal] of Object.entries(mergedGoals)) {
    const firestoreGoal = toFirestoreGoal(goal);
    if (!firestoreGoal.targetKg) continue;
    batch.set(
      services.firestoreApi.doc(db, userPath(uid, "goals"), exerciseId),
      firestoreGoal,
      { merge: true }
    );
  }
  for (const tombstone of activeDeletedRecords) {
    batch.set(
      services.firestoreApi.doc(db, userPath(uid, "deletedWorkoutRecords"), tombstone.id),
      toFirestoreDeletedRecord(tombstone),
      { merge: true }
    );
    batch.delete(services.firestoreApi.doc(db, userPath(uid, "workoutRecords"), tombstone.id));
  }
  for (const tombstone of staleDeletedRecords) {
    batch.delete(services.firestoreApi.doc(db, userPath(uid, "deletedWorkoutRecords"), tombstone.id));
  }
  for (const tombstone of activeDeletedGoals) {
    batch.set(
      services.firestoreApi.doc(db, userPath(uid, "deletedGoals"), tombstone.id),
      toFirestoreDeletedRecord(tombstone),
      { merge: true }
    );
    batch.delete(services.firestoreApi.doc(db, userPath(uid, "goals"), tombstone.id));
  }
  for (const tombstone of staleDeletedGoals) {
    batch.delete(services.firestoreApi.doc(db, userPath(uid, "deletedGoals"), tombstone.id));
  }
  await batch.commit();

  return {
    history: mergedRecords,
    goals: mergedGoals,
    deletedRecords: activeDeletedRecords,
    deletedGoals: activeDeletedGoals,
    stats: {
      recordCount: mergedRecords.length,
      goalCount: Object.keys(mergedGoals).length,
      deletedRecordCount: activeDeletedRecords.length,
      deletedGoalCount: activeDeletedGoals.length,
      remoteRecordCount: remoteRecords.length,
      remoteGoalCount: remoteGoalDocs.length,
    },
  };
}

export async function syncUserData(params) {
  const services = await getFirebaseFirestoreServices();
  return syncUserDataWithServices(params, services);
}
