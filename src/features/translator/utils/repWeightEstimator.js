import { clamp, convertWeight } from "@/lib/utils";

export const SUPPORTED_REP_RANGE = { min: 1, max: 15 };

export const LIFT_OPTIONS = [
  { id: "bench-press", label: "Bench Press", labelKo: "벤치프레스", abbr: "BP", profileLabel: "벤치프레스 반복 비율" },
  { id: "overhead-press", label: "Overhead Press", labelKo: "오버헤드프레스", abbr: "OHP", profileLabel: "오버헤드프레스 반복 비율" },
  { id: "squat", label: "Squat", labelKo: "스쿼트", abbr: "SQ", profileLabel: "스쿼트 반복 비율" },
  { id: "deadlift", label: "Deadlift", labelKo: "데드리프트", abbr: "DL", profileLabel: "데드리프트 반복 비율" },
  { id: "barbell-row", label: "Barbell Row", labelKo: "바벨로우", abbr: "ROW", profileLabel: "바벨로우 반복 비율" },
];

export const LIFT_MAP = Object.fromEntries(LIFT_OPTIONS.map((lift) => [lift.id, lift]));

const LIFT_REP_PERCENTAGES = {
  "bench-press": {
    1: 100, 2: 95, 3: 92.5, 4: 90, 5: 87.5, 6: 85, 7: 82.5, 8: 80, 9: 77.5, 10: 75, 11: 72.5, 12: 70, 13: 67.5, 14: 65, 15: 62.5,
  },
  "overhead-press": {
    1: 100, 2: 94, 3: 91, 4: 88, 5: 85, 6: 82, 7: 79.5, 8: 77, 9: 74.5, 10: 72, 11: 69.5, 12: 67, 13: 64.5, 14: 62, 15: 60,
  },
  "squat": {
    1: 100, 2: 96, 3: 93.5, 4: 91, 5: 88.5, 6: 86, 7: 84, 8: 82, 9: 79.5, 10: 77, 11: 74.5, 12: 72, 13: 69.5, 14: 67, 15: 64.5,
  },
  "deadlift": {
    1: 100, 2: 96.5, 3: 94, 4: 91.5, 5: 89, 6: 86.5, 7: 84, 8: 81.5, 9: 79, 10: 76.5, 11: 74, 12: 71.5, 13: 69, 14: 66.5, 15: 64,
  },
  "barbell-row": {
    1: 100, 2: 95, 3: 92, 4: 89.5, 5: 87, 6: 84.5, 7: 82, 8: 79.5, 9: 77, 10: 74.5, 11: 72, 12: 69.5, 13: 67, 14: 64.5, 15: 62,
  },
};

function roundToGymIncrement(value, unit) {
  const increment = unit === "lb" ? 5 : 2.5;
  return Math.round(value / increment) * increment;
}

export function getRepPercentage(exerciseId, reps) {
  const normalized = clamp(parseInt(reps, 10), SUPPORTED_REP_RANGE.min, SUPPORTED_REP_RANGE.max);
  const profile = LIFT_REP_PERCENTAGES[exerciseId];
  return profile?.[normalized] ?? null;
}

export function validateRepWeightInputs({ exerciseId, oneRM, reps }) {
  const errors = {};

  if (!exerciseId || !LIFT_MAP[exerciseId]) {
    errors.exercise = "운동을 선택해 주세요.";
  }

  const parsedOneRM = parseFloat(oneRM);
  if (!oneRM || Number.isNaN(parsedOneRM) || parsedOneRM <= 0) {
    errors.oneRM = "유효한 1RM을 입력해 주세요.";
  } else if (parsedOneRM > 600) {
    errors.oneRM = "1RM은 600 이하로 입력해 주세요.";
  }

  const parsedReps = parseInt(reps, 10);
  if (!reps || Number.isNaN(parsedReps)) {
    errors.reps = "목표 반복 횟수를 입력해 주세요.";
  } else if (parsedReps < SUPPORTED_REP_RANGE.min || parsedReps > SUPPORTED_REP_RANGE.max) {
    errors.reps = `${SUPPORTED_REP_RANGE.min}~${SUPPORTED_REP_RANGE.max}회 범위에서 입력해 주세요.`;
  }

  return errors;
}

export function calculateTargetRepWeight({ exerciseId, oneRM, reps, unit = "kg" }) {
  const parsedOneRM = parseFloat(oneRM);
  const parsedReps = parseInt(reps, 10);
  const percentage = getRepPercentage(exerciseId, parsedReps);

  if (!exerciseId || !LIFT_MAP[exerciseId] || !parsedOneRM || !percentage) {
    return null;
  }

  const oneRMKg = unit === "lb" ? convertWeight(parsedOneRM, "lb", "kg") : parsedOneRM;
  const rawWeightKg = oneRMKg * (percentage / 100);
  const roundedKg = roundToGymIncrement(rawWeightKg, "kg");
  const displayWeight = unit === "lb" ? roundToGymIncrement(convertWeight(roundedKg, "kg", "lb"), "lb") : roundedKg;
  const lift = LIFT_MAP[exerciseId];

  return {
    lift,
    reps: parsedReps,
    percentage,
    inputOneRM: parsedOneRM,
    oneRMKg: parseFloat(oneRMKg.toFixed(1)),
    estimatedWeightKg: parseFloat(roundedKg.toFixed(1)),
    estimatedWeight: parseFloat(displayWeight.toFixed(1)),
    unit,
    explanation: `입력한 ${lift.labelKo} 1RM 기준으로 ${parsedReps}회는 약 ${parseFloat(displayWeight.toFixed(1))}${unit}, 1RM의 약 ${percentage}% 수준입니다.`,
  };
}
