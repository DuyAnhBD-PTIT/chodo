/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#667eea";
const tintColorDark = "#8b9aff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    screenBackground: "#f8f9fa",
    tint: tintColorLight,
    primary: tintColorLight,
    secondary: "#666",
    tertiary: "#999",
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    border: "#e0e0e0",
    card: "#fff",
    error: "#ef4444",
    success: "#22c55e",
    warning: "#f59e0b",
  },
  dark: {
    text: "#ECEDEE",
    background: "#1a1a1a",
    screenBackground: "#0f0f0f",
    tint: tintColorDark,
    primary: tintColorDark,
    secondary: "#a0a0a0",
    tertiary: "#666",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    border: "#333",
    card: "#242424",
    error: "#f87171",
    success: "#4ade80",
    warning: "#fbbf24",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
