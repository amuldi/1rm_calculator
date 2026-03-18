import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId } from "@/lib/utils";

export const useWorkoutStore = create(
  persist(
    (set, get) => ({
      history: [],

      addRecord: (record) => {
        const newRecord = {
          ...record,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ history: [newRecord, ...state.history] }));
        return newRecord;
      },

      deleteRecord: (id) =>
        set((state) => ({ history: state.history.filter((r) => r.id !== id) })),

      clearHistory: () => set({ history: [] }),

      importHistory: (records) => {
        const imported = records.map((r) => ({
          ...r,
          id: r.id || generateId(),
          createdAt: r.createdAt || r.date || new Date().toISOString(),
        }));
        set({ history: imported });
      },

      getPRByExercise: () => {
        const map = {};
        for (const record of get().history) {
          const key = record.exerciseId;
          if (!map[key] || record.rm > map[key].rm) {
            map[key] = record;
          }
        }
        return map;
      },

      getWeeklyVolume: () => {
        const now = Date.now();
        const week = 7 * 86400000;
        return get()
          .history.filter((r) => now - new Date(r.date).getTime() <= week)
          .reduce((s, r) => s + r.weight * r.reps, 0);
      },

      getStreakDays: () => {
        const dates = [
          ...new Set(get().history.map((r) => r.date?.split("T")[0])),
        ].sort((a, b) => b.localeCompare(a));

        if (!dates.length) return 0;
        let streak = 0;
        const today = new Date().toISOString().split("T")[0];
        let cursor = today;

        for (const d of dates) {
          if (d === cursor) {
            streak++;
            const prev = new Date(cursor);
            prev.setDate(prev.getDate() - 1);
            cursor = prev.toISOString().split("T")[0];
          } else break;
        }
        return streak;
      },
    }),
    { name: "1rm-workout", version: 1 }
  )
);
