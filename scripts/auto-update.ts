#!/usr/bin/env tsx

import { execSync } from 'child_process';

/**
 * Auto-update script that updates pnpm and all dependencies to their latest versions
 * This runs before pre-deploy to ensure the project uses the latest packages
 */

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function log(message: string, color: string = RESET) {
  console.log(`${color}${message}${RESET}`);
}

async function autoUpdate() {
  // Update pnpm itself - detect installation method and use appropriate command
  log('[AUTO-UPDATE] Updating pnpm...', BLUE);
  try {
    // Check which pnpm to determine installation method
    const pnpmPath = execSync('which pnpm', { encoding: 'utf-8' }).trim();

    if (pnpmPath.includes('homebrew') || pnpmPath.includes('brew')) {
      // Homebrew installation - use brew upgrade
      execSync('brew upgrade pnpm', { stdio: 'inherit', cwd: process.cwd() });
    } else {
      // Try npm global install (may require sudo, will fail gracefully)
      execSync('npm install -g pnpm@latest', { stdio: 'inherit', cwd: process.cwd() });
    }
    log('[AUTO-UPDATE] pnpm updated successfully', GREEN);
  } catch (pnpmError) {
    // If update fails, continue anyway - not critical
    log('[AUTO-UPDATE] Skipping pnpm update (requires manual update)', YELLOW);
  }

  log('[AUTO-UPDATE] Checking for dependency updates...', BLUE);

  try {
    // Run pnpm update --latest to update all dependencies
    execSync('pnpm update --latest', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    log('[AUTO-UPDATE] Dependencies updated successfully', GREEN);
  } catch (error) {
    // If update fails, log warning but don't block the dev/build process
    log('[AUTO-UPDATE] Warning: Dependency update was skipped or failed', YELLOW);
    log('[AUTO-UPDATE] Continuing with existing dependencies...', YELLOW);
  }
}

// Run the auto-update
autoUpdate();
