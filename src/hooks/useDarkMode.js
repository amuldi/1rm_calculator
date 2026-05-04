import { useEffect } from "react";
import { useUIStore } from "@/store/uiStore";

function setFavicon(isDark) {
  const favicon = document.getElementById("app-favicon");
  if (!favicon) return;
  favicon.href = isDark ? "/favicon-dark.svg" : "/favicon-light.svg";
}

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
    setFavicon(isDark);
  }, [isDark]);

  return { isDark, setDark, toggle: () => setDark(!isDark) };
}
