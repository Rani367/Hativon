#!/usr/bin/env tsx

/**
 * Database migration runner
 *
 * Usage:
 *   pnpm run db:migrate        - Run all pending migrations
 *   pnpm run db:migrate status - Show migration status
 *   pnpm run db:migrate rollback - Rollback last migration
 *   pnpm run db:migrate rollback N - Rollback last N migrations
 */

import { runMigrations, rollbackMigrations, getMigrationStatus } from '../src/lib/db/migrations';
import { migrations } from '../src/lib/db/migrations/registry';

async function main() {
  const command = process.argv[2] || 'up';
  const arg = process.argv[3];

  try {
    switch (command) {
      case 'up':
      case 'migrate':
        await runMigrations(migrations);
        break;

      case 'status':
        const status = await getMigrationStatus(migrations);
        console.log('\n[MIGRATION STATUS]');
        console.log(`Total migrations: ${status.total}`);
        console.log(`Executed: ${status.executed}`);
        console.log(`Pending: ${status.pending}`);

        if (status.executedMigrations.length > 0) {
          console.log('\n[EXECUTED MIGRATIONS]');
          status.executedMigrations.forEach(m => {
            console.log(`  - ${m.id} (${m.name}) - ${m.executed_at}`);
          });
        }
        break;

      case 'rollback':
        const count = arg ? parseInt(arg, 10) : 1;
        if (isNaN(count) || count < 1) {
          console.error('[ERROR] Invalid rollback count');
          process.exit(1);
        }
        await rollbackMigrations(migrations, count);
        break;

      default:
        console.error(`[ERROR] Unknown command: ${command}`);
        console.log('\nUsage:');
        console.log('  pnpm run db:migrate        - Run pending migrations');
        console.log('  pnpm run db:migrate status - Show migration status');
        console.log('  pnpm run db:migrate rollback [N] - Rollback last N migrations');
        process.exit(1);
    }
  } catch (error) {
    console.error('[ERROR] Migration failed:', error);
    process.exit(1);
  }
}

main();
