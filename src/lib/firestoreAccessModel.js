export const USER_COLLECTION_NAMES = [
  "workoutRecords",
  "deletedWorkoutRecords",
  "goals",
  "deletedGoals",
];

export const WORKOUT_RECORD_FIELD_NAMES = [
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
];

export const DELETED_RECORD_FIELD_NAMES = [
  "id",
  "deletedAt",
  "updatedAt",
  "syncVersion",
];

export const GOAL_FIELD_NAMES = [
  "targetKg",
  "targetDate",
  "createdAt",
  "updatedAt",
  "syncVersion",
];

const USER_COLLECTIONS = new Set(USER_COLLECTION_NAMES);
const WORKOUT_RECORD_FIELDS = new Set(WORKOUT_RECORD_FIELD_NAMES);
const DELETED_RECORD_FIELDS = new Set(DELETED_RECORD_FIELD_NAMES);
const GOAL_FIELDS = new Set(GOAL_FIELD_NAMES);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyFields(data, allowed) {
  return Object.keys(data).every((key) => allowed.has(key));
}

function hasFields(data, fields) {
  return fields.every((field) => Object.hasOwn(data, field));
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function isOptionalString(value) {
  return value == null || typeof value === "string";
}

function isPositiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isPositiveInt(value) {
  return Number.isInteger(value) && value > 0;
}

function isSyncVersion(value) {
  return Number.isInteger(value) && value >= 1;
}

export function parseUserScopedPath(path = "") {
  const parts = String(path).split("/").filter(Boolean);
  if (parts[0] !== "users" || !parts[1]) return null;

  if (parts.length === 2) {
    return {
      uid: parts[1],
      collection: "",
      documentId: "",
      valid: true,
    };
  }

  const collection = parts[2] || "";
  const documentId = parts[3] || "";
  return {
    uid: parts[1],
    collection,
    documentId,
    valid: parts.length === 4 && USER_COLLECTIONS.has(collection) && Boolean(documentId),
  };
}

export function canAccessFirestorePath({ authUid = "", path = "" } = {}) {
  const parsed = parseUserScopedPath(path);
  if (!parsed?.valid) return false;
  return Boolean(authUid) && authUid === parsed.uid;
}

export function isValidWorkoutRecordDocument(data = {}, documentId = "") {
  if (!isPlainObject(data)) return false;
  return hasOnlyFields(data, WORKOUT_RECORD_FIELDS)
    && hasFields(data, [
      "id",
      "exerciseId",
      "weight",
      "weightKg",
      "reps",
      "sets",
      "rm",
      "rmKg",
      "unit",
      "date",
      "createdAt",
      "updatedAt",
      "syncVersion",
    ])
    && data.id === documentId
    && isNonEmptyString(data.exerciseId)
    && isPositiveNumber(data.weight)
    && isPositiveNumber(data.weightKg)
    && isPositiveInt(data.reps)
    && data.reps <= 30
    && isPositiveInt(data.sets)
    && data.sets <= 20
    && isPositiveNumber(data.rm)
    && isPositiveNumber(data.rmKg)
    && ["kg", "lb"].includes(data.unit)
    && isOptionalString(data.formula)
    && (data.rpe == null || (isPositiveNumber(data.rpe) && data.rpe <= 10))
    && isOptionalString(data.notes)
    && isNonEmptyString(data.date)
    && isNonEmptyString(data.createdAt)
    && isNonEmptyString(data.updatedAt)
    && isSyncVersion(data.syncVersion);
}

export function isValidDeletedRecordDocument(data = {}, documentId = "") {
  if (!isPlainObject(data)) return false;
  return hasOnlyFields(data, DELETED_RECORD_FIELDS)
    && hasFields(data, ["id", "deletedAt", "updatedAt", "syncVersion"])
    && data.id === documentId
    && isNonEmptyString(data.deletedAt)
    && isNonEmptyString(data.updatedAt)
    && isSyncVersion(data.syncVersion);
}

export function isValidGoalDocument(data = {}) {
  if (!isPlainObject(data)) return false;
  return hasOnlyFields(data, GOAL_FIELDS)
    && hasFields(data, ["targetKg", "createdAt", "updatedAt", "syncVersion"])
    && isPositiveNumber(data.targetKg)
    && isOptionalString(data.targetDate)
    && isNonEmptyString(data.createdAt)
    && isNonEmptyString(data.updatedAt)
    && isSyncVersion(data.syncVersion);
}

export function canWriteFirestorePath({ authUid = "", path = "", data = {} } = {}) {
  const parsed = parseUserScopedPath(path);
  if (!parsed?.valid || !authUid || authUid !== parsed.uid) return false;
  if (parsed.collection === "workoutRecords") {
    return isValidWorkoutRecordDocument(data, parsed.documentId);
  }
  if (parsed.collection === "deletedWorkoutRecords") {
    return isValidDeletedRecordDocument(data, parsed.documentId);
  }
  if (parsed.collection === "goals") return isValidGoalDocument(data);
  if (parsed.collection === "deletedGoals") {
    return isValidDeletedRecordDocument(data, parsed.documentId);
  }
  return false;
}
