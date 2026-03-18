import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUIStore = create(
  persist(
    (set) => ({
      isDark: true,
      unit: "kg",
      selectedFormula: "epley",
      activeTab: "dashboard",

      setDark: (val) => set({ isDark: val }),
      setUnit: (unit) => set({ unit }),
      setFormula: (formula) => set({ selectedFormula: formula }),
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: "1rm-ui",
      version: 1,
    }
  )
);
