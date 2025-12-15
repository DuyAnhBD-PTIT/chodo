import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useDeviceColorScheme } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  themeMode: ThemeMode;
  effectiveTheme: "light" | "dark";
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "@marketplace_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");

  // Load saved theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error("Load theme error:", error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error("Save theme error:", error);
    }
  };

  // Calculate effective theme based on mode
  const effectiveTheme: "light" | "dark" =
    themeMode === "system"
      ? deviceColorScheme === "dark"
        ? "dark"
        : "light"
      : themeMode;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        effectiveTheme,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
