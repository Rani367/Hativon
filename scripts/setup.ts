#!/usr/bin/env tsx

/**
 * Automated Local Development Setup Script
 *
 * This script automatically sets up everything needed to run the project locally:
 * - Creates .env.local from .env.example if it doesn't exist
 * - Generates secure JWT_SECRET automatically
 * - Sets default values for development
 * - Creates data directory for local posts storage
 * - Initializes database if PostgreSQL is available
 * - Provides clear next steps
 */

import { createInterface } from 'readline';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    readline.question(query, resolve);
  });
};

const projectRoot = join(__dirname, '..');
const envPath = join(projectRoot, '.env.local');
const envExamplePath = join(projectRoot, '.env.example');
const dataDir = join(projectRoot, 'data');

console.log('[SETUP] Setting up local development environment...\n');

// Step 1: Create data directory for local posts storage
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log('[OK] Created data/ directory for local posts storage');
} else {
  console.log('[OK] data/ directory already exists');
}

// Step 2: Check if .env.local exists
let envExists = existsSync(envPath);
let shouldSetup = true;

if (envExists) {
  console.log('\n[WARNING]  .env.local already exists');
  const answer = await question('Do you want to regenerate it? This will overwrite existing values. (y/N): ');
  shouldSetup = answer.toLowerCase() === 'y';

  if (!shouldSetup) {
    console.log('[OK] Keeping existing .env.local');
  }
}

// Step 3: Generate or update .env.local
if (shouldSetup) {
  console.log('\n[INFO] Creating .env.local with secure defaults...');

  // Generate secure JWT secret
  const jwtSecret = randomBytes(32).toString('base64');

  // Read .env.example as template
  let envContent = existsSync(envExamplePath)
    ? readFileSync(envExamplePath, 'utf-8')
    : '';

  // Replace placeholder values with actual defaults
  envContent = envContent
    .replace(/ADMIN_PASSWORD=.*/g, `ADMIN_PASSWORD=${await question('\nEnter admin password (min 8 chars) [default: admin123]: ') || 'admin123'}`)
    .replace(/JWT_SECRET=.*/g, `JWT_SECRET=${jwtSecret}`)
    .replace(/NEXT_PUBLIC_SITE_URL=.*/g, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`)
    .replace(/SESSION_DURATION=.*/g, `SESSION_DURATION=604800`)
    .replace(/BLOB_READ_WRITE_TOKEN=.*/g, `BLOB_READ_WRITE_TOKEN=`)
    .replace(/POSTGRES_URL=$/gm, `POSTGRES_URL=`);

  writeFileSync(envPath, envContent);
  console.log('[OK] Created .env.local with secure JWT secret');
}

// Step 4: Check for PostgreSQL and offer to set up database
console.log('\n[INFO] Checking for PostgreSQL...');

let hasPostgres = false;
let dbUrl = '';

try {
  // Try to detect PostgreSQL
  if (process.platform === 'darwin') {
    // macOS
    try {
      execSync('which psql', { stdio: 'pipe' });
      hasPostgres = true;
    } catch {}
  } else if (process.platform === 'linux') {
    // Linux
    try {
      execSync('which psql', { stdio: 'pipe' });
      hasPostgres = true;
    } catch {}
  } else if (process.platform === 'win32') {
    // Windows
    try {
      execSync('where psql', { stdio: 'pipe' });
      hasPostgres = true;
    } catch {}
  }

  if (hasPostgres) {
    console.log('[OK] PostgreSQL detected');

    const setupDb = await question('\nDo you want to set up the database now? (Y/n): ');
    if (setupDb.toLowerCase() !== 'n') {
      // Prompt for database details
      console.log('\n[INFO] Database configuration:');
      const dbHost = await question('  Host [localhost]: ') || 'localhost';
      const dbPort = await question('  Port [5432]: ') || '5432';
      const dbUser = await question('  Username [postgres]: ') || 'postgres';
      const dbPassword = await question('  Password: ');
      const dbName = await question('  Database name [school_newspaper]: ') || 'school_newspaper';

      dbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

      // Add database URL to .env.local
      let envContent = readFileSync(envPath, 'utf-8');

      if (envContent.includes('POSTGRES_URL=')) {
        // Replace existing empty POSTGRES_URL
        envContent = envContent.replace(/POSTGRES_URL=.*$/m, `POSTGRES_URL=${dbUrl}`);
        envContent = envContent.replace(/POSTGRES_URL_NON_POOLING=.*$/m, `POSTGRES_URL_NON_POOLING=${dbUrl}`);
      } else {
        // Add POSTGRES_URL
        envContent += `\n\n# Local PostgreSQL Database\nPOSTGRES_URL=${dbUrl}\nPOSTGRES_URL_NON_POOLING=${dbUrl}\n`;
      }

      writeFileSync(envPath, envContent);
      console.log('[OK] Added database configuration to .env.local');

      // Initialize database
      console.log('\n[INFO] Initializing database schema...');
      try {
        execSync('pnpm run db:init', {
          stdio: 'inherit',
          cwd: projectRoot
        });
        console.log('[OK] Database schema initialized');
      } catch (error) {
        console.log('[WARNING]  Database initialization failed. You may need to create the database first.');
        console.log(`   Run: createdb ${dbName}`);
      }
    }
  } else {
    console.log('[WARNING]  PostgreSQL not detected');
    console.log('   The app will run in local-only mode (posts stored in data/posts.json)');
    console.log('   To enable full features, install PostgreSQL and run: pnpm run setup');
  }
} catch (error) {
  console.log('[WARNING]  Could not detect PostgreSQL');
}

// Step 5: Summary and next steps
console.log('\n');
console.log('═'.repeat(60));
console.log('[OK] Setup complete!');
console.log('═'.repeat(60));
console.log('\n[INFO] Next steps:\n');

if (hasPostgres && dbUrl) {
  console.log('   1. Create your first admin user:');
  console.log('      pnpm run create-admin\n');
  console.log('   2. Start the development server:');
  console.log('      pnpm run dev\n');
  console.log('   3. Open http://localhost:3000 in your browser\n');
} else {
  console.log('   1. (Optional) Install PostgreSQL for full features');
  console.log('   2. Start the development server:');
  console.log('      pnpm run dev\n');
  console.log('   3. Open http://localhost:3000 in your browser\n');
  console.log('   [INFO]  Without PostgreSQL, posts will be stored in data/posts.json\n');
}

console.log('[INFO] For more information, see CLAUDE.md\n');

readline.close();
process.exit(0);
