/**
 * Migration registry
 *
 * Import and register all migrations here in chronological order.
 * Migrations will be executed in the order they appear in this array.
 */

import type { Migration } from "./index";
import initialSchema from "./20250101000000_initial_schema";
import addTeacherSupport from "./20250115000000_add_teacher_support";
import addSettingsTable from "./20251229000000_add_settings_table";
import addPasswordReset from "./20260226000000_add_password_reset";
import addPasswordResetTokens from "./20260320000000_add_password_reset_tokens";
import addPostWordCount from "./20260505000000_add_post_word_count";
import addUserThemePreferences from "./20260515000000_add_user_theme_preferences";
import removeDarkModeAnnouncement from "./20260524000000_remove_dark_mode_announcement";
import addAiImageDetection from "./20260526000000_add_ai_image_detection";

/**
 * All registered migrations in execution order
 */
export const migrations: Migration[] = [
  initialSchema,
  addTeacherSupport,
  addSettingsTable,
  addPasswordReset,
  addPasswordResetTokens,
  addPostWordCount,
  addUserThemePreferences,
  removeDarkModeAnnouncement,
  addAiImageDetection,
];

/**
 * Get migration by ID
 */
export function getMigrationById(id: string): Migration | undefined {
  return migrations.find((m) => m.id === id);
}

/**
 * Get migrations after a specific ID
 */
export function getMigrationsAfter(id: string): Migration[] {
  const index = migrations.findIndex((m) => m.id === id);
  return index === -1 ? migrations : migrations.slice(index + 1);
}
