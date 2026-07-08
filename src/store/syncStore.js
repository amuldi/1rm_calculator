import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeSyncStats } from "@/lib/syncFeedback";

export const useSyncStore = create(
  persist(
    (set) => ({
      lastSyncedAt: "",
      lastSyncStats: null,
      lastSyncError: "",

      markSyncSuccess: (stats = {}) => {
        set({
          lastSyncedAt: new Date().toISOString(),
          lastSyncStats: normalizeSyncStats(stats),
          lastSyncError: "",
        });
      },

      markSyncError: (message) => {
        set({
          lastSyncError: message || "동기화에 실패했습니다.",
        });
      },

      clearSyncStatus: () => {
        set({
          lastSyncedAt: "",
          lastSyncStats: null,
          lastSyncError: "",
        });
      },
    }),
    {
      name: "1rm-sync-status",
      version: 1,
    }
  )
);
