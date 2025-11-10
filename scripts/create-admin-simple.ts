#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

import { createUser, getUserByUsername } from '../src/lib/users';

async function main() {
  console.log('[INFO] Creating default user...\n');

  const username = 'admin';
  const displayName = 'מנהל';
  const password = 'admin123';
  const grade = 'ז';
  const classNumber = 1;

  try {
    // Check if user already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      console.log(`[OK] User "${username}" already exists.`);
      console.log('   You can log in with these credentials.\n');
      process.exit(0);
    }

    // Create user
    const user = await createUser({
      username,
      password,
      displayName,
      grade: grade as any,
      classNumber,
    });

    console.log('[OK] User created successfully!\n');
    console.log('[INFO] Login Credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Display Name: ${user.displayName}\n`);
    console.log('[OK] You can now log in at the homepage\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n[ERROR] Failed to create user:');
    console.error(error.message || error);
    process.exit(1);
  }
}

main();
