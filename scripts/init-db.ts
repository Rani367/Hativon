#!/usr/bin/env ts-node

/**
 * Database Initialization Script
 *
 * This script initializes the PostgreSQL database with required tables.
 * Run this once after enabling Vercel Postgres or setting up local Postgres.
 *
 * Usage:
 *   pnpm run db:init
 *   or: pnpm exec tsx scripts/init-db.ts
 *
 * Requirements:
 *   - POSTGRES_URL or POSTGRES_URL_NON_POOLING environment variable must be set
 *   - Database must be accessible
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

import { initializeDatabase, checkDatabaseSetup } from '../src/lib/db/init';

async function main() {
  const isSilent = process.argv.includes('--silent');

  if (!isSilent) {
    console.log('[INFO] Starting database initialization...\n');
  }

  try {
    // Check if database is already set up
    const isSetup = await checkDatabaseSetup();

    if (isSetup) {
      if (isSilent) {
        // In silent mode, skip if already set up
        process.exit(0);
      }

      console.log('[INFO] Database tables already exist.');
      console.log('   If you want to recreate them, drop the tables manually first.\n');

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      await new Promise<void>((resolve) => {
        readline.question('Continue anyway? (y/N): ', (answer: string) => {
          readline.close();
          if (answer.toLowerCase() !== 'y') {
            console.log('[INFO] Aborted.');
            process.exit(0);
          }
          resolve();
        });
      });
    }

    // Initialize database
    await initializeDatabase(isSilent);

    if (!isSilent) {
      console.log('\n[OK] Database initialized successfully!');
      console.log('\n[INFO] Next steps:');
      console.log('   1. Create an admin user: pnpm run create-admin');
      console.log('   2. Start the development server: pnpm run dev');
      console.log('   3. Visit /admin to log in\n');
    }

    process.exit(0);
  } catch (error) {
    if (!isSilent) {
      console.error('\n[ERROR] Database initialization failed:');
      console.error(error);
      console.log('\n[INFO] Troubleshooting:');
      console.log('   - Make sure POSTGRES_URL is set in .env.local');
      console.log('   - Check that your database is accessible');
      console.log('   - Verify your Vercel Postgres is enabled (in production)\n');
    }
    process.exit(1);
  }
}

main();
