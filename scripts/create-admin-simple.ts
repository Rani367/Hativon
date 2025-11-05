#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

import { createAdminUser, getUserByUsername } from '../src/lib/users';

async function main() {
  console.log('👤 Creating default admin user...\n');

  const username = 'admin';
  const displayName = 'מנהל';
  const password = 'admin123';

  try {
    // Check if user already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      console.log(`✅ Admin user "${username}" already exists.`);
      console.log('   You can log in with these credentials.\n');
      process.exit(0);
    }

    // Create admin user
    const user = await createAdminUser({
      username,
      password,
      displayName,
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('📋 Login Credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Display Name: ${user.displayName}`);
    console.log(`   Role: ${user.role}\n`);
    console.log('🎉 You can now log in at /admin\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Failed to create admin user:');
    console.error(error.message || error);
    process.exit(1);
  }
}

main();
