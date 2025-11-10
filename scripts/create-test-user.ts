#!/usr/bin/env tsx
/**
 * Create Test User Script (Non-interactive)
 * Creates a default test user for local development
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

import { createUser, getUserByUsername } from '../src/lib/users';

async function main() {
  console.log('[USER] Creating test user...\n');

  try {
    // Check if user already exists
    const existingUser = await getUserByUsername('testuser');
    if (existingUser) {
      console.log('[OK] Test user already exists');
      console.log('\n[INFO] Login credentials:');
      console.log('   Username: testuser');
      console.log('   Password: password123');
      console.log('   Admin Password (for /admin): admin123\n');
      process.exit(0);
    }

    // Create test user
    const user = await createUser({
      username: 'testuser',
      password: 'password123',
      displayName: 'משתמש בדיקה',
      grade: 'ט',
      classNumber: 1,
    });

    console.log('[OK] Test user created successfully!\n');
    console.log('[INFO] Login credentials:');
    console.log('   Username: testuser');
    console.log('   Password: password123');
    console.log('   Admin Password (for /admin): admin123\n');

    process.exit(0);
  } catch (error: any) {
    console.error('[ERROR] Failed to create test user:', error.message || error);
    process.exit(1);
  }
}

main();
