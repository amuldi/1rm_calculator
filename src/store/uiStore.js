import { create } from "zustand";
import { persist } from "zustand/middleware";

function getInitialDarkMode() {
  if (typeof window === "undefined") return true;
  try {
    const saved = JSON.parse(window.localStorage.getItem("1rm-ui") || "{}");
    return typeof saved?.state?.isDark === "boolean" ? saved.state.isDark : true;
  } catch {
    return true;
  }
}

export const useUIStore = create(
  persist(
    (set) => ({
      isDark: getInitialDarkMode(),
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
