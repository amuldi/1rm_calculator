export const FORMULA_LIST = [
  { id: "epley", label: "Epley", description: "Most widely used formula" },
  { id: "brzycki", label: "Brzycki", description: "Accurate for lower rep ranges" },
  { id: "lombardi", label: "Lombardi", description: "Conservative estimate" },
  { id: "mayhew", label: "Mayhew", description: "Research-validated formula" },
  { id: "oconner", label: "O'Conner", description: "Simple linear model" },
];

export const FORMULAS = {
  epley: (w, r) => w * (1 + r / 30),
  brzycki: (w, r) => (r > 1 ? w * (36 / (37 - r)) : w),
  lombardi: (w, r) => w * Math.pow(r, 0.1),
  mayhew: (w, r) => (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r)),
  oconner: (w, r) => w * (1 + 0.025 * r),
};

export function calculate1RM(weight, reps, formula = "epley") {
  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  if (!w || !r || r < 1 || r > 30) return null;
  const fn = FORMULAS[formula] || FORMULAS.epley;
  return parseFloat(fn(w, r).toFixed(1));
}

export function calculateAll1RM(weight, reps) {
  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  if (!w || !r || r < 1 || r > 30) return null;
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
