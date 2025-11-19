#!/usr/bin/env tsx

import { execSync } from 'child_process';

/**
 * Auto-update script that updates all dependencies to their latest versions
 * This runs before dev and pre-deploy to ensure the project uses the latest packages
 */

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function log(message: string, color: string = RESET) {
  console.log(`${color}${message}${RESET}`);
}

async function autoUpdate() {
  try {
    log('[AUTO-UPDATE] Checking for dependency updates...', BLUE);

    // Run pnpm update --latest to update all dependencies
    execSync('pnpm update --latest', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    log('[AUTO-UPDATE] Dependencies updated successfully', GREEN);
  } catch (error) {
    // If update fails, log warning but don't block the dev/build process
    log('[AUTO-UPDATE] Warning: Failed to auto-update dependencies', YELLOW);
    log('[AUTO-UPDATE] Continuing with existing dependencies...', YELLOW);

    if (error instanceof Error) {
      console.error(error.message);
    }
  }
}

// Run the auto-update
autoUpdate();
