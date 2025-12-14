/**
 * Migration registry
 *
 * Import and register all migrations here in chronological order.
 * Migrations will be executed in the order they appear in this array.
 */

import type { Migration } from "./index";
import initialSchema from "./20250101000000_initial_schema";
import addTeacherSupport from "./20250115000000_add_teacher_support";

/**
 * All registered migrations in execution order
 */
export const migrations: Migration[] = [initialSchema, addTeacherSupport];

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
