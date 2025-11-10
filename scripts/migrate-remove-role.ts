#!/usr/bin/env tsx
/**
 * Migration script to remove role column from users table
 *
 * This script removes the role-based authentication system,
 * converting to a password-protected admin panel system.
 *
 * Usage:
 *   tsx scripts/migrate-remove-role.ts
 */

import { db } from '../src/lib/db/client';

async function migrateRemoveRole() {
  console.log('Starting migration: Remove role column from users table...\n');

  try {
    // Check if the role column exists
    const checkColumn = await db.query`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'role'
      ) as exists;
    ` as any;

    const roleColumnExists = checkColumn.rows[0]?.exists;

    if (!roleColumnExists) {
      console.log('[OK] Role column does not exist. Migration not needed.');
      return;
    }

    console.log('Found role column in users table.');
    console.log('Removing role column and related index...\n');

    // Drop the index first (if it exists)
    await db.query`DROP INDEX IF EXISTS idx_users_role;` as any;
    console.log('[OK] Dropped idx_users_role index');

    // Drop the role column
    await db.query`ALTER TABLE users DROP COLUMN IF EXISTS role;` as any;
    console.log('[OK] Dropped role column from users table');

    console.log('\n[OK] Migration completed successfully!');
    console.log('\nAll users now have equal permissions.');
    console.log('Access to admin panel is controlled by ADMIN_PASSWORD environment variable.\n');

  } catch (error) {
    console.error('[ERROR] Migration failed:', error);
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrateRemoveRole()
    .then(() => {
      console.log('Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateRemoveRole };
