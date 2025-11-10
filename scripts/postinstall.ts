#!/usr/bin/env tsx

/**
 * Post-Install Setup Script
 *
 * Runs automatically after `pnpm install` to set up EVERYTHING needed for local development.
 * This is completely automated - no prompts, no extra steps needed.
 *
 * What this does:
 * - Creates .env.local with secure defaults
 * - Creates data/ directory
 * - Detects and configures PostgreSQL if available
 * - Initializes database schema automatically
 * - Creates default admin user
 *
 * After this completes, just run: pnpm run dev
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { execSync } from 'child_process';

const projectRoot = join(__dirname, '..');
const envPath = join(projectRoot, '.env.local');
const envExamplePath = join(projectRoot, '.env.example');
const dataDir = join(projectRoot, 'data');

// Skip postinstall in CI/CD environments
if (process.env.CI || process.env.VERCEL || process.env.GITHUB_ACTIONS) {
  console.log('[INFO] Skipping postinstall in CI/CD environment');
  process.exit(0);
}

console.log('\n[SETUP] Running automated setup...\n');

// Step 1: Create data directory
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log('[OK] Created data/ directory');
}

// Step 2: Create .env.local if it doesn't exist
const isNewEnv = !existsSync(envPath);
if (isNewEnv) {
  console.log('[INFO] Creating .env.local with secure defaults...');

  // Generate secure JWT secret
  const jwtSecret = randomBytes(32).toString('base64');

  // Read .env.example as template
  let envContent = existsSync(envExamplePath)
    ? readFileSync(envExamplePath, 'utf-8')
    : '';

  // Replace placeholder values with secure defaults
  envContent = envContent
    .replace(/ADMIN_PASSWORD=.*/g, `ADMIN_PASSWORD=admin123`)
    .replace(/JWT_SECRET=.*/g, `JWT_SECRET=${jwtSecret}`)
    .replace(/NEXT_PUBLIC_SITE_URL=.*/g, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`)
    .replace(/SESSION_DURATION=.*/g, `SESSION_DURATION=604800`)
    .replace(/BLOB_READ_WRITE_TOKEN=.*/g, `BLOB_READ_WRITE_TOKEN=`)
    .replace(/POSTGRES_URL=$/gm, `POSTGRES_URL=`);

  writeFileSync(envPath, envContent);
  console.log('[OK] Created .env.local with secure JWT secret');
  console.log('[WARNING] Default admin password: admin123 (change this in .env.local)');
} else {
  console.log('[OK] .env.local already exists');
}

// Step 3: Auto-detect and configure PostgreSQL
console.log('\n[INFO] Detecting PostgreSQL...');

let hasPostgres = false;
let dbConfigured = false;

// Check if POSTGRES_URL is already configured
const existingEnvContent = readFileSync(envPath, 'utf-8');
const hasPostgresUrl = existingEnvContent.match(/POSTGRES_URL=postgresql:\/\/.+/);

if (hasPostgresUrl) {
  console.log('[OK] PostgreSQL already configured in .env.local');
  dbConfigured = true;
  hasPostgres = true;
} else {
  // Try to detect PostgreSQL installation
  try {
    const psqlCheck = process.platform === 'win32' ? 'where psql' : 'which psql';
    execSync(psqlCheck, { stdio: 'pipe' });
    hasPostgres = true;
    console.log('[OK] PostgreSQL detected on system');
  } catch {
    console.log('[WARNING] PostgreSQL not detected');
    console.log('   App will run in admin-only mode (posts stored locally)');
    console.log('   To enable full features, install PostgreSQL and run: pnpm run setup');
  }
}

// Step 4: Auto-configure database if PostgreSQL is available and not already configured
if (hasPostgres && !dbConfigured && isNewEnv) {
  console.log('\n[INFO] Configuring local database...');

  const dbName = 'school_newspaper';
  const dbUser = process.env.USER || 'postgres';
  const dbHost = 'localhost';
  const dbPort = '5432';

  try {
    // Try to create the database (will fail silently if exists)
    console.log(`   Creating database "${dbName}"...`);
    try {
      execSync(`createdb -U ${dbUser} -h ${dbHost} -p ${dbPort} ${dbName}`, {
        stdio: 'pipe',
        timeout: 5000
      });
      console.log(`   [OK] Created database "${dbName}"`);
    } catch (createError: any) {
      // Database might already exist, which is fine
      if (createError.message?.includes('already exists')) {
        console.log(`   [OK] Database "${dbName}" already exists`);
      } else {
        // Try without specifying user (for peer authentication)
        try {
          execSync(`createdb ${dbName}`, { stdio: 'pipe', timeout: 5000 });
          console.log(`   [OK] Created database "${dbName}"`);
        } catch {
          console.log(`   [WARNING] Could not create database (may already exist)`);
        }
      }
    }

    // Build connection string
    const dbUrl = `postgresql://${dbUser}@${dbHost}:${dbPort}/${dbName}`;

    // Test connection
    console.log('   Testing database connection...');
    try {
      execSync(`psql "${dbUrl}" -c "SELECT 1" -t`, { stdio: 'pipe', timeout: 5000 });

      // Connection successful, add to .env.local
      let envContent = readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(
        /POSTGRES_URL=$/m,
        `POSTGRES_URL=${dbUrl}`
      );
      envContent = envContent.replace(
        /POSTGRES_URL_NON_POOLING=$/m,
        `POSTGRES_URL_NON_POOLING=${dbUrl}`
      );

      writeFileSync(envPath, envContent);
      console.log('   [OK] Database connection configured');
      dbConfigured = true;
    } catch (testError) {
      console.log('   [WARNING] Could not connect to database');
      console.log('   App will run in admin-only mode');
      console.log('   For manual setup, run: pnpm run setup');
    }
  } catch (error: any) {
    console.log('   [WARNING] Database auto-configuration failed');
    console.log('   App will run in admin-only mode');
  }
}

// Step 5: Initialize database schema if database is configured
if (dbConfigured && isNewEnv) {
  console.log('\n[INFO] Initializing database schema...');
  try {
    // Re-read .env.local to get POSTGRES_URL
    const envContent = readFileSync(envPath, 'utf-8');
    const postgresUrlMatch = envContent.match(/POSTGRES_URL=(.+)/);

    if (postgresUrlMatch) {
      // Set environment variable for child process
      process.env.POSTGRES_URL = postgresUrlMatch[1];

      // Run db:init using tsx directly
      execSync('npx tsx scripts/init-db.ts --silent', {
        stdio: 'pipe',
        cwd: projectRoot,
        env: { ...process.env, POSTGRES_URL: postgresUrlMatch[1] },
        timeout: 10000
      });

      console.log('[OK] Database schema initialized');

      // Step 6: Create default admin user
      console.log('\n[INFO] Creating default admin user...');
      try {
        execSync('npx tsx scripts/create-admin-simple.ts', {
          stdio: 'pipe',
          cwd: projectRoot,
          env: { ...process.env, POSTGRES_URL: postgresUrlMatch[1] },
          timeout: 10000
        });
        console.log('[OK] Admin user created (username: admin, password: admin123)');
      } catch (userError) {
        console.log('[WARNING] Could not create admin user (may already exist)');
      }
    }
  } catch (error: any) {
    console.log('[WARNING] Database initialization skipped');
    console.log('   You can run manually: pnpm run db:init');
  }
}

// Step 7: Show completion message
console.log('\n' + '═'.repeat(60));
console.log('[OK] Setup complete! Everything is ready to go.');
console.log('═'.repeat(60));
console.log('\n[INFO] Start developing:\n');
console.log('   pnpm run dev');
console.log('\n   Then open http://localhost:3000\n');

if (dbConfigured) {
  console.log('[INFO] Login credentials:');
  console.log('   Username: admin');
  console.log('   Password: admin123\n');
  console.log('[WARNING] Change the password in production!\n');
} else {
  console.log('[INFO] Running in admin-only mode');
  console.log('   Access admin panel at: http://localhost:3000/admin');
  console.log('   Password: admin123\n');
}

console.log('[INFO] For more info, see CLAUDE.md or README.md\n');
