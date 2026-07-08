import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mergeDiagnosticEvents } from "@/lib/diagnostics";

export const useDiagnosticStore = create(
  persist(
    (set) => ({
      events: [],

      recordEvent: (event) => {
        set((state) => ({
          events: mergeDiagnosticEvents(state.events, event),
        }));
      },

      clearEvents: () => {
        set({ events: [] });
      },
    }),
    {
      name: "1rm-diagnostics",
      version: 1,
    }
  )
);
