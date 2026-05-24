import type { ThemePreference } from "@/types/user.types";

export const THEME_STORAGE_KEY = "hativon-theme";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark";
}
