import { useEffect } from "react";
import { useUIStore } from "@/store/uiStore";

export function useDarkMode() {
  const { isDark, setDark } = useUIStore();

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, [isDark]);

  return { isDark, setDark, toggle: () => setDark(!isDark) };
}
