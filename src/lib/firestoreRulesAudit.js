import {
  DELETED_RECORD_FIELD_NAMES,
  GOAL_FIELD_NAMES,
  USER_COLLECTION_NAMES,
  WORKOUT_RECORD_FIELD_NAMES,
} from "./firestoreAccessModel.js";

const EXPECTED_RULE_SHAPES = [
  {
    collection: "workoutRecords",
    matchVariable: "recordId",
    shapeFunction: "hasWorkoutRecordShape",
    expectedFields: WORKOUT_RECORD_FIELD_NAMES,
  },
  {
    collection: "deletedWorkoutRecords",
    matchVariable: "recordId",
    shapeFunction: "hasDeletedRecordShape",
    expectedFields: DELETED_RECORD_FIELD_NAMES,
  },
  {
    collection: "goals",
    matchVariable: "exerciseId",
    shapeFunction: "hasGoalShape",
    expectedFields: GOAL_FIELD_NAMES,
  },
  {
    collection: "deletedGoals",
    matchVariable: "exerciseId",
    shapeFunction: "hasDeletedRecordShape",
    expectedFields: DELETED_RECORD_FIELD_NAMES,
  },
];

function uniqueSorted(values = []) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function extractFunctionBody(rulesText, functionName) {
  const start = rulesText.indexOf(`function ${functionName}`);
  if (start < 0) return "";
  const open = rulesText.indexOf("{", start);
  if (open < 0) return "";

  let depth = 0;
  for (let index = open; index < rulesText.length; index += 1) {
    const char = rulesText[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return rulesText.slice(open + 1, index);
  }
  return "";
}

function extractFieldList(functionBody, methodName) {
  const marker = `keys().${methodName}([`;
  const start = functionBody.indexOf(marker);
  if (start < 0) return [];
  const listStart = start + marker.length;
  const listEnd = functionBody.indexOf("]", listStart);
  if (listEnd < 0) return [];
  return uniqueSorted(
    [...functionBody.slice(listStart, listEnd).matchAll(/"([^"]+)"/g)]
      .map((match) => match[1])
  );
}

function collectionBlockExists(rulesText, shape) {
  return rulesText.includes(`match /${shape.collection}/{${shape.matchVariable}}`);
}

function collectionWriteIsOwnerScoped(rulesText, shape) {
  const createUpdatePattern = new RegExp(
    `match\\s+/${shape.collection}/\\{${shape.matchVariable}\\}[\\s\\S]*?allow\\s+create,\\s*update:\\s*if\\s+isOwner\\(uid\\)\\s+&&\\s+${shape.shapeFunction}\\(`
  );
  const readDeletePattern = new RegExp(
    `match\\s+/${shape.collection}/\\{${shape.matchVariable}\\}[\\s\\S]*?allow\\s+read,\\s*delete:\\s*if\\s+isOwner\\(uid\\)`
  );
  return createUpdatePattern.test(rulesText) && readDeletePattern.test(rulesText);
}

export function auditFirestoreRules(rulesText = "") {
  const issues = [];
  const text = String(rulesText);

  if (!text.includes("rules_version = '2';")) {
    issues.push("rules_version must be set to version 2.");
  }
  if (!text.includes("service cloud.firestore")) {
    issues.push("Rules must target cloud.firestore.");
  }
  if (!text.includes("function isOwner(uid)") || !text.includes("request.auth.uid == uid")) {
    issues.push("Rules must define an auth uid owner check.");
  }
  if (!text.includes("match /users/{uid}")) {
    issues.push("Rules must scope user data under /users/{uid}.");
  }
  if (!text.includes("allow write: if false;")) {
    issues.push("The /users/{uid} document must not allow broad writes.");
  }

  for (const shape of EXPECTED_RULE_SHAPES) {
    if (!collectionBlockExists(text, shape)) {
      issues.push(`Missing match block for ${shape.collection}.`);
      continue;
    }
    if (!collectionWriteIsOwnerScoped(text, shape)) {
      issues.push(`${shape.collection} writes must require owner and schema checks.`);
    }

    const body = extractFunctionBody(text, shape.shapeFunction);
    if (!body) {
      issues.push(`Missing ${shape.shapeFunction} function.`);
      continue;
    }

    const expectedFields = uniqueSorted(shape.expectedFields);
    const hasOnlyFields = extractFieldList(body, "hasOnly");
    const missingFromHasOnly = expectedFields.filter((field) => !hasOnlyFields.includes(field));
    const extraInHasOnly = hasOnlyFields.filter((field) => !expectedFields.includes(field));
    if (missingFromHasOnly.length || extraInHasOnly.length) {
      issues.push(`${shape.shapeFunction} hasOnly fields differ from app schema.`);
    }

    const hasAllFields = extractFieldList(body, "hasAll");
    const missingRequiredFields = hasAllFields.filter((field) => !expectedFields.includes(field));
    if (missingRequiredFields.length) {
      issues.push(`${shape.shapeFunction} hasAll contains fields outside the app schema.`);
    }
  }

  for (const collection of USER_COLLECTION_NAMES) {
    if (!text.includes(`/${collection}/`)) {
      issues.push(`Rules do not mention expected collection ${collection}.`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
