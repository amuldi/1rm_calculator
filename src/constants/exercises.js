export const EXERCISES = [
  { id: "bench-press",    label: "Bench Press",    labelKo: "벤치프레스",    abbr: "BP",  muscleGroup: "chest" },
  { id: "squat",          label: "Squat",           labelKo: "스쿼트",        abbr: "SQ",  muscleGroup: "legs" },
  { id: "deadlift",       label: "Deadlift",        labelKo: "데드리프트",    abbr: "DL",  muscleGroup: "back" },
  { id: "overhead-press", label: "Overhead Press",  labelKo: "오버헤드프레스", abbr: "OHP", muscleGroup: "shoulders" },
  { id: "barbell-row",    label: "Barbell Row",     labelKo: "바벨로우",      abbr: "BR",  muscleGroup: "back" },
];

export const EXERCISE_MAP = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export const CHART_COLORS = ["#C9A84C", "#a09880", "#7a7060", "#bfb09a", "#d6cbb8"];

export const FILTER_OPTIONS = [
  { value: "all",   label: "전체" },
  { value: "month", label: "30일" },
  { value: "week",  label: "7일" },
];
