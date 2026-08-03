import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { ConfigProvider, type ThemeConfig } from "antd";
import { getTokens, lightTokens, darkTokens, type DesignTokens } from "../theme/tokens";
import { getAntdTheme } from "../theme/antdTheme";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  prefersReducedMotion: boolean;
  tokens: DesignTokens;
  antdTheme: ThemeConfig;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "eduspace_theme";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark" || saved === "system") {
        return saved;
      }
    } catch {
      // ignore
    }
    return "system";
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  // Listen to OS theme and motion changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    // Dark mode listener
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleDarkChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    // Reduced motion listener
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (darkModeQuery.addEventListener) {
      darkModeQuery.addEventListener("change", handleDarkChange);
      motionQuery.addEventListener("change", handleMotionChange);
      return () => {
        darkModeQuery.removeEventListener("change", handleDarkChange);
        motionQuery.removeEventListener("change", handleMotionChange);
      };
    } else {
      darkModeQuery.addListener(handleDarkChange);
      motionQuery.addListener(handleMotionChange);
      return () => {
        darkModeQuery.removeListener(handleDarkChange);
        motionQuery.removeListener(handleMotionChange);
      };
    }
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === "dark") return true;
    if (themeMode === "light") return false;
    return systemIsDark;
  }, [themeMode, systemIsDark]);

  // Sync data-theme attribute on <html> element
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", isDark ? "dark" : "light");
    root.style.colorScheme = isDark ? "dark" : "light";
  }, [isDark]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    setThemeMode(isDark ? "light" : "dark");
  };

  const currentTokens = useMemo(() => getTokens(isDark), [isDark]);
  const currentAntdTheme = useMemo(() => getAntdTheme(isDark, prefersReducedMotion), [isDark, prefersReducedMotion]);

  const value: ThemeContextType = {
    themeMode,
    isDark,
    prefersReducedMotion,
    tokens: currentTokens,
    antdTheme: currentAntdTheme,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={currentAntdTheme}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback if rendered outside provider
    const isDark = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";
    const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
    return {
      themeMode: "system",
      isDark,
      prefersReducedMotion,
      tokens: getTokens(isDark),
      antdTheme: getAntdTheme(isDark, prefersReducedMotion),
      setThemeMode: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}
