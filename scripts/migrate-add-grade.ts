#!/usr/bin/env tsx

/**
 * Database migration to add grade and class_number columns to users table
 * Run this script to update your production database schema
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../src/lib/db/client';

async function migrateDatabase() {
  console.log('Starting database migration...\n');

  try {
    // Check if columns already exist
    console.log('Checking current schema...');
    const checkResult = await db.query`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name IN ('grade', 'class_number')
    ` as any;

    const existingColumns = checkResult.rows.map((row: any) => row.column_name);

    if (existingColumns.includes('grade') && existingColumns.includes('class_number')) {
      console.log('Columns already exist. Migration not needed.');
      return;
    }

    console.log('Current columns:', existingColumns.length > 0 ? existingColumns.join(', ') : 'none');

    // Add grade column if it doesn't exist
    if (!existingColumns.includes('grade')) {
      console.log('\nAdding grade column...');
      await db.query`
        ALTER TABLE users
        ADD COLUMN grade VARCHAR(10) DEFAULT 'י' NOT NULL
          CHECK (grade IN ('ז', 'ח', 'ט', 'י'))
      ` as any;
      console.log('Grade column added successfully');
    }

    // Add class_number column if it doesn't exist
    if (!existingColumns.includes('class_number')) {
      console.log('\nAdding class_number column...');
      await db.query`
        ALTER TABLE users
        ADD COLUMN class_number INTEGER DEFAULT 1 NOT NULL
          CHECK (class_number >= 1 AND class_number <= 4)
      ` as any;
      console.log('Class_number column added successfully');
    }

    console.log('\nMigration completed successfully!');
    console.log('\nNote: Existing users will have default values:');
    console.log('  - grade: י (10th grade)');
    console.log('  - class_number: 1');
    console.log('\nYou can update these values manually if needed.');

  } catch (error: any) {
    console.error('\nMigration failed:', error.message);
    throw error;
  }
}

// Run migration
migrateDatabase()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFailed to migrate database:', error);
    process.exit(1);
  });
