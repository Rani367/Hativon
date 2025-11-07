#!/usr/bin/env tsx

/**
 * Environment Variable Validation Script
 *
 * Validates all required environment variables before deployment.
 * This script runs as part of the Vercel deployment process via `npm run pre-deploy`.
 *
 * Catches missing or invalid environment variables before the build starts,
 * preventing deployment failures and providing helpful error messages.
 *
 * Usage:
 *   npm run pre-deploy (runs this automatically)
 *   tsx scripts/validate-env.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load .env.local file if it exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

interface ValidationError {
  variable: string;
  message: string;
  severity: 'error' | 'warning';
  hint?: string;
}

const errors: ValidationError[] = [];
const warnings: ValidationError[] = [];

/**
 * Add a validation error
 */
function addError(variable: string, message: string, hint?: string) {
  errors.push({ variable, message, severity: 'error', hint });
}

/**
 * Add a validation warning
 */
function addWarning(variable: string, message: string, hint?: string) {
  warnings.push({ variable, message, severity: 'warning', hint });
}

/**
 * Check if running in Vercel build environment
 */
function isVercelBuild(): boolean {
  return process.env.VERCEL === '1';
}

/**
 * Check if variable is set and not empty
 */
function isSet(value: string | undefined): boolean {
  return value !== undefined && value.trim() !== '';
}

/**
 * Validate ADMIN_PASSWORD
 */
function validateAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;

  if (!isSet(password)) {
    addError('ADMIN_PASSWORD', 'Admin password is required',
      'Set a secure password for admin panel access');
    return;
  }

  if (password!.length < 8) {
    addWarning('ADMIN_PASSWORD', 'Password is too short (minimum 8 characters recommended)',
      'Use a stronger password for better security');
  }

  // Check for weak passwords
  const weakPasswords = ['admin', 'password', '12345678', 'admin123'];
  if (weakPasswords.includes(password!.toLowerCase())) {
    addWarning('ADMIN_PASSWORD', 'Weak password detected',
      'Avoid common passwords like "admin123" or "password"');
  }
}

/**
 * Validate JWT_SECRET
 */
function validateJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!isSet(secret)) {
    addError('JWT_SECRET', 'JWT secret is required for user authentication',
      'Generate with: openssl rand -base64 32');
    return;
  }

  if (secret!.length < 32) {
    addError('JWT_SECRET', 'JWT secret must be at least 32 characters long',
      'Generate a stronger secret with: openssl rand -base64 32');
  }

  // Check for weak secrets
  if (secret === 'your_jwt_secret_here' || secret === 'secret' || secret === '123456') {
    addError('JWT_SECRET', 'Using a placeholder or weak JWT secret',
      'Generate a secure secret with: openssl rand -base64 32');
  }
}

/**
 * Validate NEXT_PUBLIC_SITE_URL
 */
function validateSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL;

  if (!isSet(url)) {
    addError('NEXT_PUBLIC_SITE_URL', 'Site URL is required',
      'Set to http://localhost:3000 for dev or https://yourdomain.com for prod');
    return;
  }

  // Check URL format
  try {
    const parsed = new URL(url!);

    // Warn if using http in production
    if (isVercelBuild() && parsed.protocol === 'http:') {
      addWarning('NEXT_PUBLIC_SITE_URL', 'Using HTTP in production',
        'Consider using HTTPS for security');
    }

    // Warn if using localhost in production
    if (isVercelBuild() && parsed.hostname === 'localhost') {
      addError('NEXT_PUBLIC_SITE_URL', 'Using localhost URL in production',
        'Set to your actual production domain (e.g., https://yourdomain.com)');
    }

    // Check for trailing slash
    if (url!.endsWith('/')) {
      addWarning('NEXT_PUBLIC_SITE_URL', 'URL should not have a trailing slash',
        'Remove the trailing slash from the URL');
    }
  } catch (e) {
    addError('NEXT_PUBLIC_SITE_URL', 'Invalid URL format',
      'Must be a valid URL (e.g., http://localhost:3000 or https://yourdomain.com)');
  }
}

/**
 * Validate SESSION_DURATION
 */
function validateSessionDuration() {
  const duration = process.env.SESSION_DURATION;

  // Optional variable, skip if not set
  if (!isSet(duration)) {
    return;
  }

  const parsed = parseInt(duration!, 10);

  if (isNaN(parsed)) {
    addError('SESSION_DURATION', 'Must be a valid number (seconds)',
      'Example: 604800 (7 days), 86400 (1 day)');
    return;
  }

  // Warn if session is too short (less than 1 hour)
  if (parsed < 3600) {
    addWarning('SESSION_DURATION', 'Session duration is very short (< 1 hour)',
      'Users will need to login frequently. Consider at least 86400 (1 day)');
  }

  // Warn if session is very long (more than 30 days)
  if (parsed > 2592000) {
    addWarning('SESSION_DURATION', 'Session duration is very long (> 30 days)',
      'Consider security implications of long-lived sessions');
  }
}

/**
 * Validate PostgreSQL configuration
 */
function validatePostgres() {
  const postgresUrl = process.env.POSTGRES_URL;
  const postgresUrlNonPooling = process.env.POSTGRES_URL_NON_POOLING;

  // In Vercel, these are auto-configured
  if (isVercelBuild()) {
    if (!isSet(postgresUrl)) {
      addWarning('POSTGRES_URL', 'Database not configured (will use admin-only mode)',
        'Enable Vercel Postgres in your dashboard for user authentication');
    }
    return;
  }

  // For local development, warn if not set
  if (!isSet(postgresUrl)) {
    addWarning('POSTGRES_URL', 'Database not configured (will use admin-only mode)',
      'Set up local Postgres or connect to Vercel Postgres for user authentication');
    return;
  }

  // Validate URL format
  if (!postgresUrl!.startsWith('postgres://') && !postgresUrl!.startsWith('postgresql://')) {
    addError('POSTGRES_URL', 'Invalid PostgreSQL connection string format',
      'Should start with postgres:// or postgresql://');
  }
}

/**
 * Validate Vercel Blob configuration
 */
function validateVercelBlob() {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  // In Vercel production, this should be set automatically
  if (isVercelBuild() && !isSet(blobToken)) {
    addWarning('BLOB_READ_WRITE_TOKEN', 'Vercel Blob not configured',
      'Enable Vercel Blob Storage in your dashboard. Posts will use local storage as fallback.');
  }

  // In local dev, it should NOT be set (unless explicitly connecting to Vercel Blob)
  if (!isVercelBuild() && isSet(blobToken)) {
    addWarning('BLOB_READ_WRITE_TOKEN', 'Blob token set in local development',
      'This will use Vercel Blob instead of local storage. Remove if not intended.');
  }
}

/**
 * Check for .env.local file existence
 */
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath) && !isVercelBuild()) {
    addWarning('.env.local', 'Environment file not found',
      'Copy .env.example to .env.local and fill in the values');
  }
}

/**
 * Print validation results
 */
function printResults() {
  console.log(`\n${colors.bold}${colors.cyan}=== Environment Variable Validation ===${colors.reset}\n`);

  if (errors.length === 0 && warnings.length === 0) {
    console.log(`${colors.green}✓ All environment variables are valid!${colors.reset}\n`);
    return true;
  }

  // Print errors
  if (errors.length > 0) {
    console.log(`${colors.red}${colors.bold}Errors (${errors.length}):${colors.reset}`);
    errors.forEach((err, index) => {
      console.log(`\n${colors.red}${index + 1}. ${err.variable}${colors.reset}`);
      console.log(`   ${err.message}`);
      if (err.hint) {
        console.log(`   ${colors.cyan}💡 ${err.hint}${colors.reset}`);
      }
    });
    console.log();
  }

  // Print warnings
  if (warnings.length > 0) {
    console.log(`${colors.yellow}${colors.bold}Warnings (${warnings.length}):${colors.reset}`);
    warnings.forEach((warn, index) => {
      console.log(`\n${colors.yellow}${index + 1}. ${warn.variable}${colors.reset}`);
      console.log(`   ${warn.message}`);
      if (warn.hint) {
        console.log(`   ${colors.cyan}💡 ${warn.hint}${colors.reset}`);
      }
    });
    console.log();
  }

  // Print summary
  if (errors.length > 0) {
    console.log(`${colors.red}${colors.bold}✗ Validation failed with ${errors.length} error(s)${colors.reset}`);
    console.log(`${colors.cyan}See .env.example for configuration guidance${colors.reset}\n`);
    return false;
  } else {
    console.log(`${colors.yellow}⚠ Validation passed with ${warnings.length} warning(s)${colors.reset}`);
    console.log(`${colors.cyan}Consider addressing warnings before deploying${colors.reset}\n`);
    return true;
  }
}

/**
 * Main validation function
 */
function main() {
  console.log(`${colors.cyan}Validating environment variables...${colors.reset}`);

  if (isVercelBuild()) {
    console.log(`${colors.blue}Running in Vercel build environment${colors.reset}`);
  }

  // Check for .env.local file
  checkEnvFile();

  // Run all validations
  validateAdminPassword();
  validateJwtSecret();
  validateSiteUrl();
  validateSessionDuration();
  validatePostgres();
  validateVercelBlob();

  // Print results
  const success = printResults();

  // Exit with error code if validation failed
  if (!success) {
    process.exit(1);
  }
}

// Run validation
main();
