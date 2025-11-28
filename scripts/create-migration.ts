#!/usr/bin/env tsx

/**
 * Create a new database migration file
 *
 * Usage:
 *   pnpm run db:create-migration "add_user_avatar"
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';

function generateMigrationId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hour}${minute}${second}`;
}

function createMigrationFile(name: string) {
  const id = generateMigrationId();
  const fileName = `${id}_${name}.ts`;
  const filePath = resolve(process.cwd(), 'src/lib/db/migrations', fileName);

  const template = `/**
 * Migration: ${name.replace(/_/g, ' ')}
 * Created: ${new Date().toISOString().split('T')[0]}
 */

import { db } from '../client';
import type { Migration } from './index';

const migration: Migration = {
  id: '${id}',
  name: '${name}',

  async up() {
    // TODO: Implement migration
    // Example:
    // await db.query\`
    //   ALTER TABLE users ADD COLUMN avatar VARCHAR(255)
    // \`;

    console.log('[MIGRATION] Applied: ${name}');
  },

  async down() {
    // TODO: Implement rollback
    // Example:
    // await db.query\`
    //   ALTER TABLE users DROP COLUMN avatar
    // \`;

    console.log('[MIGRATION] Rolled back: ${name}');
  },
};

export default migration;
`;

  writeFileSync(filePath, template, 'utf-8');

  console.log('[OK] Created migration file:');
  console.log(`  ${fileName}`);
  console.log('\nNext steps:');
  console.log('  1. Edit the migration file to implement up() and down() functions');
  console.log('  2. Add the migration to src/lib/db/migrations/registry.ts');
  console.log('  3. Run: pnpm run db:migrate');
}

function main() {
  const name = process.argv[2];

  if (!name) {
    console.error('[ERROR] Migration name is required');
    console.log('\nUsage:');
    console.log('  pnpm run db:create-migration "migration_name"');
    console.log('\nExample:');
    console.log('  pnpm run db:create-migration "add_user_avatar"');
    process.exit(1);
  }

  // Validate name (snake_case)
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    console.error('[ERROR] Migration name must be in snake_case (lowercase, underscores only)');
    console.error(`  Invalid: "${name}"`);
    console.error('  Valid examples: "add_column", "create_table", "add_user_avatar"');
    process.exit(1);
  }

  createMigrationFile(name);
}

main();
