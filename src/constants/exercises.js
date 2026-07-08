export const EXERCISES = [
  { id: "bench-press",    label: "Bench Press",    labelKo: "벤치프레스",    abbr: "BP",  muscleGroup: "chest" },
  { id: "squat",          label: "Squat",           labelKo: "스쿼트",        abbr: "SQ",  muscleGroup: "legs" },
  { id: "deadlift",       label: "Deadlift",        labelKo: "데드리프트",    abbr: "DL",  muscleGroup: "back" },
  { id: "overhead-press", label: "Overhead Press",  labelKo: "오버헤드프레스", abbr: "OHP", muscleGroup: "shoulders" },
  { id: "barbell-row",    label: "Barbell Row",     labelKo: "바벨로우",      abbr: "BR",  muscleGroup: "back" },
  { id: "pull-up",        label: "Pull-up",         labelKo: "풀업",          abbr: "PU",  muscleGroup: "back" },
  { id: "lat-pulldown",   label: "Lat Pulldown",    labelKo: "렛풀다운",      abbr: "LP",  muscleGroup: "back" },
  { id: "leg-press",      label: "Leg Press",       labelKo: "레그프레스",    abbr: "LEG", muscleGroup: "legs" },
  { id: "dumbbell-press", label: "Dumbbell Press",  labelKo: "덤벨프레스",    abbr: "DBP", muscleGroup: "chest" },
  { id: "hip-thrust",     label: "Hip Thrust",      labelKo: "힙쓰러스트",    abbr: "HT",  muscleGroup: "legs" },
];

export const EXERCISE_MAP = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export const CHART_COLORS = ["#00C8FF", "#7C8CF8", "#F4BD50", "#FF7A59", "#A3B18A"];

export const FILTER_OPTIONS = [
  { value: "all",   label: "전체" },
  { value: "month", label: "30일" },
  { value: "week",  label: "7일" },
];
