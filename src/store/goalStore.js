import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  convertWeight,
  getGoalDisplay,
  getGoalKg as readGoalKg,
  roundWeight,
} from "@/lib/utils";

function normalizeGoal(value, unit = "kg") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return unit === "lb" ? convertWeight(numeric, "lb", "kg") : roundWeight(numeric);
}

function normalizeGoalMap(goals) {
  if (!goals || typeof goals !== "object") return {};
  return Object.entries(goals).reduce((next, [exerciseId, goal]) => {
    const goalKg = readGoalKg(goal);
    if (goalKg != null && goalKg > 0) next[exerciseId] = goalKg;
    return next;
  }, {});
}

export const useGoalStore = create(
  persist(
    (set, get) => ({
      goals: {},

      setGoal: (exerciseId, value, unit = "kg") => {
        const goalKg = normalizeGoal(value, unit);
        if (!exerciseId || goalKg == null) return;
        set((state) => ({
          goals: { ...state.goals, [exerciseId]: goalKg },
        }));
      },

      deleteGoal: (exerciseId) =>
        set((state) => {
          const next = { ...state.goals };
          delete next[exerciseId];
          return { goals: next };
        }),

      getGoal: (exerciseId, unit = "kg") => getGoalDisplay(get().goals[exerciseId], unit),

      getGoalKg: (exerciseId) => readGoalKg(get().goals[exerciseId]),

      getProgress: (exerciseId, currentRMKg) => {
        const goalKg = readGoalKg(get().goals[exerciseId]);
        const current = Number(currentRMKg);
        if (!goalKg || !Number.isFinite(current) || current <= 0) return 0;
        return Math.min(100, Math.round((current / goalKg) * 100));
      },

      importGoals: (goals) => set({ goals: normalizeGoalMap(goals) }),
    }),
    {
      name: "1rm-goals",
      version: 2,
      migrate: (state) => ({
        ...state,
        goals: normalizeGoalMap(state?.goals),
      }),
    }
  )
);
