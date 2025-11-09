#!/usr/bin/env tsx

/**
 * Post-Install Setup Script
 *
 * Runs automatically after `pnpm install` to set up essential files.
 * This is non-interactive - for interactive setup, run: pnpm run setup
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

const projectRoot = join(__dirname, '..');
const envPath = join(projectRoot, '.env.local');
const envExamplePath = join(projectRoot, '.env.example');
const dataDir = join(projectRoot, 'data');

// Skip postinstall in CI/CD environments
if (process.env.CI || process.env.VERCEL || process.env.GITHUB_ACTIONS) {
  console.log('ℹ️  Skipping postinstall in CI/CD environment');
  process.exit(0);
}

console.log('\n📦 Running post-install setup...\n');

// Step 1: Create data directory
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log('✅ Created data/ directory');
}

// Step 2: Create .env.local if it doesn't exist
if (!existsSync(envPath)) {
  console.log('📝 Creating .env.local with default values...');

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
  console.log('✅ Created .env.local with secure defaults');
  console.log('   ⚠️  Default admin password: admin123 (change this!)');
} else {
  console.log('✓ .env.local already exists');
}

// Step 3: Show next steps
console.log('\n' + '═'.repeat(60));
console.log('✅ Post-install complete!');
console.log('═'.repeat(60));
console.log('\n📋 Next steps:\n');
console.log('   For interactive setup with database configuration:');
console.log('   → pnpm run setup\n');
console.log('   Or start developing right away:');
console.log('   → pnpm run dev\n');
console.log('   Then open http://localhost:3000\n');
console.log('📚 For more info, see CLAUDE.md\n');
