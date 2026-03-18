import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useGoalStore = create(
  persist(
    (set, get) => ({
      goals: {},

      setGoal: (exerciseId, value) =>
        set((state) => ({
          goals: { ...state.goals, [exerciseId]: parseFloat(value) },
        })),

      deleteGoal: (exerciseId) =>
        set((state) => {
          const next = { ...state.goals };
          delete next[exerciseId];
          return { goals: next };
        }),

      getGoal: (exerciseId) => get().goals[exerciseId] ?? null,

      getProgress: (exerciseId, currentRM) => {
        const goal = get().goals[exerciseId];
        if (!goal || !currentRM) return 0;
        return Math.min(100, Math.round((currentRM / goal) * 100));
      },

      importGoals: (goals) => set({ goals }),
    }),
    { name: "1rm-goals", version: 1 }
  )
);
