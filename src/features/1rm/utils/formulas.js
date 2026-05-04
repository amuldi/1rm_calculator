export const MAX_REPS = 15;

export const FORMULA_LIST = [
  { id: "epley", label: "Epley", description: "대형 복합 리프트에 안정적" },
  { id: "brzycki", label: "Brzycki", description: "저반복 고중량에 강함" },
  { id: "lombardi", label: "Lombardi", description: "보조 리프트에 보수적" },
  { id: "mayhew", label: "Mayhew", description: "벤치프레스 연구 기반" },
  { id: "oconner", label: "O'Conner", description: "상체 프레스에 보수적" },
];

export const DEFAULT_FORMULA = "epley";

export const EXERCISE_FORMULA_MAP = {
  "bench-press": "mayhew",
  squat: "epley",
  deadlift: "brzycki",
  "overhead-press": "oconner",
  "barbell-row": "lombardi",
};

export const FORMULAS = {
  epley: (w, r) => w * (1 + r / 30),
  brzycki: (w, r) => (r > 1 ? w * (36 / (37 - r)) : w),
  lombardi: (w, r) => w * Math.pow(r, 0.1),
  mayhew: (w, r) => (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r)),
  oconner: (w, r) => w * (1 + 0.025 * r),
};

export function getFormulaMeta(formulaId) {
  return FORMULA_LIST.find((formula) => formula.id === formulaId) || FORMULA_LIST[0];
}

export function getRecommendedFormulaId(exerciseId) {
  return EXERCISE_FORMULA_MAP[exerciseId] || DEFAULT_FORMULA;
}

export function getRecommendedFormula(exerciseId) {
  return getFormulaMeta(getRecommendedFormulaId(exerciseId));
}

export function calculate1RM(weight, reps, formula = DEFAULT_FORMULA) {
  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  if (!w || !r || r < 1 || r > MAX_REPS) return null;
  const fn = FORMULAS[formula] || FORMULAS[DEFAULT_FORMULA];
  return parseFloat(fn(w, r).toFixed(1));
}

export function calculateAll1RM(weight, reps) {
  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  if (!w || !r || r < 1 || r > MAX_REPS) return null;
  return FORMULA_LIST.map((f) => ({
    ...f,
    value: parseFloat(FORMULAS[f.id](w, r).toFixed(1)),
  }));
}

export function getPercentages(rm1) {
  const pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60];
  return pcts.map((pct) => ({
    pct,
    weight: parseFloat(((rm1 * pct) / 100).toFixed(1)),
    reps: pct >= 100 ? 1 : pct >= 95 ? 2 : pct >= 90 ? 3 : pct >= 85 ? 5 : pct >= 80 ? 6 : pct >= 75 ? 8 : pct >= 70 ? 10 : pct >= 65 ? 12 : 15,
  }));
}
