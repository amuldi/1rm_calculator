import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  generateId,
  getRecordRMKg,
  getRecordVolume,
  normalizeWorkoutRecord,
} from "@/lib/utils";
import { mergeDeletedEntities, normalizeDeletedEntity } from "@/lib/syncModel";

function sortByNewest(records) {
  return [...records].sort((a, b) => {
    const aTime = new Date(a.date || a.createdAt || 0).getTime() || 0;
    const bTime = new Date(b.date || b.createdAt || 0).getTime() || 0;
    return bTime - aTime;
  });
}

function normalizeRecords(records) {
  if (!Array.isArray(records)) return [];
  return sortByNewest(
    records.map((record) =>
      normalizeWorkoutRecord({
        ...record,
        id: record.id || generateId(),
        createdAt: record.createdAt || record.date || new Date().toISOString(),
      })
    )
  );
}

function normalizeDeletedRecords(records) {
  if (!Array.isArray(records)) return [];
  return mergeDeletedEntities(records, []);
}

function createDeletedRecord(recordOrId) {
  const now = new Date().toISOString();
  const id = typeof recordOrId === "string" ? recordOrId : recordOrId?.id;
  if (!id) return null;
  return normalizeDeletedEntity({
    id,
    deletedAt: now,
    updatedAt: now,
    syncVersion: (Number(recordOrId?.syncVersion) || 1) + 1,
  });
}

export const useWorkoutStore = create(
  persist(
    (set, get) => ({
      history: [],
      deletedRecords: [],

      addRecord: (record) => {
        const now = new Date().toISOString();
        const newRecord = normalizeWorkoutRecord({
          ...record,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          syncVersion: record.syncVersion || 1,
          date: record.date || now,
        });
        set((state) => ({ history: [newRecord, ...state.history] }));
        return newRecord;
      },

      deleteRecord: (id) =>
        set((state) => {
          const record = state.history.find((r) => r.id === id);
          const tombstone = createDeletedRecord(record || id);
          return {
            history: state.history.filter((r) => r.id !== id),
            deletedRecords: tombstone
              ? mergeDeletedEntities(state.deletedRecords, [tombstone])
              : state.deletedRecords,
          };
        }),

      updateRecord: (id, changes) =>
        set((state) => ({
          history: normalizeRecords(
            state.history.map((record) =>
              record.id === id
                ? normalizeWorkoutRecord({
                    ...record,
                    ...changes,
                    id: record.id,
                    updatedAt: new Date().toISOString(),
                    syncVersion: (Number(record.syncVersion) || 1) + 1,
                  })
                : record
            )
          ),
        })),

      clearHistory: () =>
        set((state) => ({
          history: [],
          deletedRecords: mergeDeletedEntities(
            state.deletedRecords,
            state.history.map(createDeletedRecord).filter(Boolean)
          ),
        })),

      importHistory: (records) => {
        set({ history: normalizeRecords(records) });
      },

      importDeletedRecords: (records) => {
        set({ deletedRecords: normalizeDeletedRecords(records) });
      },

      getPRByExercise: () => {
        const map = {};
        for (const record of get().history) {
          const key = record.exerciseId;
          if (!key) continue;
          if (!map[key] || getRecordRMKg(record) > getRecordRMKg(map[key])) {
            map[key] = record;
          }
        }
        return map;
      },

      getWeeklyVolume: (unit = "kg") => {
        const now = Date.now();
        const week = 7 * 86400000;
        return get()
          .history.filter((r) => {
            const time = new Date(r.date).getTime();
            return Number.isFinite(time) && now - time <= week;
          })
          .reduce((sum, record) => sum + getRecordVolume(record, unit), 0);
      },

      getStreakDays: () => {
        const dates = [
          ...new Set(
            get()
              .history.map((r) => r.date?.split("T")[0])
              .filter(Boolean)
          ),
        ].sort((a, b) => b.localeCompare(a));

        if (!dates.length) return 0;
        let streak = 0;
        const today = new Date().toISOString().split("T")[0];
        let cursor = today;

        for (const date of dates) {
          if (date === cursor) {
            streak++;
            const prev = new Date(cursor);
            prev.setDate(prev.getDate() - 1);
            cursor = prev.toISOString().split("T")[0];
          } else {
            break;
          }
        }
        return streak;
      },
    }),
    {
      name: "1rm-workout",
      version: 2,
      migrate: (state) => ({
        ...state,
        history: normalizeRecords(state?.history),
        deletedRecords: normalizeDeletedRecords(state?.deletedRecords),
      }),
    }
  )
);
