import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  convertWeight,
  getGoalDisplay,
  getGoalKg as readGoalKg,
  roundWeight,
} from "@/lib/utils";
import { mergeDeletedEntities, normalizeDeletedEntity } from "@/lib/syncModel";

function normalizeGoal(value, unit = "kg") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return unit === "lb" ? convertWeight(numeric, "lb", "kg") : roundWeight(numeric);
}

function normalizeGoalMap(goals) {
  if (!goals || typeof goals !== "object") return {};
  return Object.entries(goals).reduce((next, [exerciseId, goal]) => {
    const goalKg = readGoalKg(goal);
    if (goalKg != null && goalKg > 0) {
      const targetDate = goal && typeof goal === "object" && typeof goal.targetDate === "string"
        ? goal.targetDate
        : "";
      const now = new Date().toISOString();
      next[exerciseId] = {
        targetKg: goalKg,
        targetDate,
        createdAt: goal?.createdAt || now,
        updatedAt: goal?.updatedAt || goal?.modifiedAt || goal?.createdAt || now,
        syncVersion: Math.max(1, Math.round(Number(goal?.syncVersion) || 1)),
      };
    }
    return next;
  }, {});
}

function normalizeDeletedGoals(records) {
  if (!Array.isArray(records)) return [];
  return mergeDeletedEntities(records, []);
}

function createDeletedGoal(exerciseId, goal) {
  if (!exerciseId) return null;
  const now = new Date().toISOString();
  return normalizeDeletedEntity({
    id: exerciseId,
    deletedAt: now,
    updatedAt: now,
    syncVersion: (Number(goal?.syncVersion) || 1) + 1,
  });
}

export const useGoalStore = create(
  persist(
    (set, get) => ({
      goals: {},
      deletedGoals: [],

      setGoal: (exerciseId, value, unit = "kg", targetDate = "") => {
        const goalKg = normalizeGoal(value, unit);
        if (!exerciseId || goalKg == null) return;
        const now = new Date().toISOString();
        set((state) => {
          const nextDeletedGoals = state.deletedGoals.filter((goal) => goal.id !== exerciseId);
          return {
            goals: {
              ...state.goals,
              [exerciseId]: {
                targetKg: goalKg,
                targetDate: typeof targetDate === "string" ? targetDate : "",
                createdAt: state.goals[exerciseId]?.createdAt || now,
                updatedAt: now,
                syncVersion: (Number(state.goals[exerciseId]?.syncVersion) || 1) + 1,
              },
            },
            deletedGoals: nextDeletedGoals,
          };
        });
      },

      deleteGoal: (exerciseId) =>
        set((state) => {
          const next = { ...state.goals };
          const tombstone = createDeletedGoal(exerciseId, state.goals[exerciseId]);
          delete next[exerciseId];
          return {
            goals: next,
            deletedGoals: tombstone
              ? mergeDeletedEntities(state.deletedGoals, [tombstone])
              : state.deletedGoals,
          };
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

      importDeletedGoals: (records) => set({ deletedGoals: normalizeDeletedGoals(records) }),
    }),
    {
      name: "1rm-goals",
      version: 3,
      migrate: (state) => ({
        ...state,
        goals: normalizeGoalMap(state?.goals),
        deletedGoals: normalizeDeletedGoals(state?.deletedGoals),
      }),
    }
  )
);
