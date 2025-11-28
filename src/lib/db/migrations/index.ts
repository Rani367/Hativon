/**
 * Database migration system
 *
 * Migrations are timestamped files that modify the database schema.
 * Each migration runs exactly once and is tracked in the migrations table.
 */

import { db } from '../client';
import type { QueryResult } from 'pg';

export interface Migration {
  id: string;
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

interface MigrationRecord {
  id: string;
  name: string;
  executed_at: Date;
}

/**
 * Ensure migrations table exists
 */
async function ensureMigrationsTable(): Promise<void> {
  await db.query`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations(): Promise<Set<string>> {
  try {
    const result = (await db.query`
      SELECT id FROM migrations ORDER BY executed_at ASC
    `) as QueryResult<{ id: string }>;

    return new Set(result.rows.map(row => row.id));
  } catch (error) {
    // If migrations table doesn't exist, return empty set
    return new Set();
  }
}

/**
 * Record a migration as executed
 */
async function recordMigration(migration: Migration): Promise<void> {
  await db.query([
    'INSERT INTO migrations (id, name, executed_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
    migration.id,
    migration.name,
  ]);
}

/**
 * Remove a migration record (for rollback)
 */
async function removeMigrationRecord(migrationId: string): Promise<void> {
  await db.query(['DELETE FROM migrations WHERE id = $1', migrationId]);
}

/**
 * Run pending migrations
 */
export async function runMigrations(migrations: Migration[]): Promise<void> {
  console.log('[MIGRATIONS] Starting migration process...');

  // Ensure migrations table exists
  await ensureMigrationsTable();

  // Get executed migrations
  const executed = await getExecutedMigrations();

  // Filter pending migrations
  const pending = migrations.filter(m => !executed.has(m.id));

  if (pending.length === 0) {
    console.log('[MIGRATIONS] No pending migrations');
    return;
  }

  console.log(`[MIGRATIONS] Found ${pending.length} pending migrations`);

  // Run each pending migration
  for (const migration of pending) {
    console.log(`[MIGRATIONS] Running: ${migration.name} (${migration.id})`);

    try {
      await migration.up();
      await recordMigration(migration);
      console.log(`[MIGRATIONS] Completed: ${migration.name}`);
    } catch (error) {
      console.error(`[MIGRATIONS] Failed: ${migration.name}`, error);
      throw new Error(`Migration failed: ${migration.name}`);
    }
  }

  console.log('[MIGRATIONS] All migrations completed successfully');
}

/**
 * Rollback the last N migrations
 */
export async function rollbackMigrations(
  migrations: Migration[],
  count = 1
): Promise<void> {
  console.log(`[MIGRATIONS] Rolling back last ${count} migration(s)...`);

  // Get executed migrations in reverse order
  const result = (await db.query`
    SELECT id FROM migrations ORDER BY executed_at DESC LIMIT ${count}
  `) as QueryResult<{ id: string }>;

  const toRollback = result.rows.map(row => row.id);

  if (toRollback.length === 0) {
    console.log('[MIGRATIONS] No migrations to rollback');
    return;
  }

  // Find and execute down migrations
  for (const migrationId of toRollback) {
    const migration = migrations.find(m => m.id === migrationId);

    if (!migration) {
      console.warn(`[MIGRATIONS] Migration ${migrationId} not found, skipping rollback`);
      continue;
    }

    console.log(`[MIGRATIONS] Rolling back: ${migration.name} (${migration.id})`);

    try {
      await migration.down();
      await removeMigrationRecord(migration.id);
      console.log(`[MIGRATIONS] Rolled back: ${migration.name}`);
    } catch (error) {
      console.error(`[MIGRATIONS] Rollback failed: ${migration.name}`, error);
      throw new Error(`Rollback failed: ${migration.name}`);
    }
  }

  console.log('[MIGRATIONS] Rollback completed successfully');
}

/**
 * Get migration status
 */
export async function getMigrationStatus(migrations: Migration[]): Promise<{
  total: number;
  executed: number;
  pending: number;
  executedMigrations: MigrationRecord[];
}> {
  await ensureMigrationsTable();

  const result = (await db.query`
    SELECT id, name, executed_at FROM migrations ORDER BY executed_at ASC
  `) as QueryResult<MigrationRecord>;

  const executed = new Set(result.rows.map(row => row.id));
  const pending = migrations.filter(m => !executed.has(m.id));

  return {
    total: migrations.length,
    executed: result.rows.length,
    pending: pending.length,
    executedMigrations: result.rows,
  };
}
