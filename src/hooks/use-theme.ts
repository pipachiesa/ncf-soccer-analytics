"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";
export type ThemeToken =
  | "--pitch-bg"
  | "--pitch-line"
  | "--pass-ok"
  | "--pass-fail"
  | "--assist"
  | "--progressive";

const STORAGE_KEY = "ncf-theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    });

    function syncTheme(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      const nextTheme: Theme = event.newValue === "light" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      setTheme(nextTheme);
    }

    window.addEventListener("storage", syncTheme);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const setActiveTheme = useCallback((nextTheme: Theme) => {
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setActiveTheme(theme === "dark" ? "light" : "dark");
  }, [setActiveTheme, theme]);

  const getThemeToken = useCallback((token: ThemeToken) => {
    return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  }, []);

  return { theme, setTheme: setActiveTheme, toggleTheme, getThemeToken };
}
