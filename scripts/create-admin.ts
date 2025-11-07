#!/usr/bin/env ts-node

/**
 * Create Admin User Script
 *
 * This script creates an admin user account.
 * Run this after initializing the database.
 *
 * Usage:
 *   npm run create-admin
 *   or: npx ts-node scripts/create-admin.ts
 *
 * Requirements:
 *   - Database must be initialized (run npm run db:init first)
 *   - POSTGRES_URL environment variable must be set
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

import { createAdminUser, getUserByUsername } from '../src/lib/users';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('👤 Admin User Creation\n');

  try {
    // Get user input
    const username = await question('Username (default: admin): ') || 'admin';

    // Check if user already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      console.log(`\n❌ User "${username}" already exists.`);
      rl.close();
      process.exit(1);
    }

    const displayName = await question('Display Name (Hebrew, default: מנהל): ') || 'מנהל';
    const gradeInput = await question('Grade (ז/ח/ט/י, default: ז): ') || 'ז';
    const classNumberInput = await question('Class Number (1-4, default: 1): ') || '1';

    const validGrades = ['ז', 'ח', 'ט', 'י'];
    if (!validGrades.includes(gradeInput)) {
      console.log('❌ Invalid grade. Must be one of: ז, ח, ט, י');
      rl.close();
      process.exit(1);
    }

    const classNumber = parseInt(classNumberInput);
    if (isNaN(classNumber) || classNumber < 1 || classNumber > 4) {
      console.log('❌ Invalid class number. Must be between 1 and 4');
      rl.close();
      process.exit(1);
    }

    let password = '';
    let confirmPassword = '';

    do {
      password = await question('Password (min 8 characters): ');
      if (password.length < 8) {
        console.log('❌ Password must be at least 8 characters long.');
        continue;
      }

      confirmPassword = await question('Confirm Password: ');
      if (password !== confirmPassword) {
        console.log('❌ Passwords do not match. Try again.\n');
      }
    } while (password !== confirmPassword || password.length < 8);

    // Create admin user
    console.log('\n🔄 Creating admin user...');

    const user = await createAdminUser({
      username,
      password,
      displayName,
      grade: gradeInput as any,
      classNumber,
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📋 User Details:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Display Name: ${user.displayName}`);
    console.log(`   Grade: ${user.grade}`);
    console.log(`   Class Number: ${user.classNumber}`);
    console.log(`   Email: ${user.email || 'Not provided'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);

    console.log('\n🎉 You can now log in to the admin panel at /admin\n');

    rl.close();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Failed to create admin user:');
    console.error(error.message || error);

    console.log('\n💡 Troubleshooting:');
    console.log('   - Make sure the database is initialized: npm run db:init');
    console.log('   - Check that POSTGRES_URL is set in .env.local');
    console.log('   - Verify your database connection\n');

    rl.close();
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  rl.close();
  process.exit(1);
});
