#!/usr/bin/env tsx

/**
 * Build Validation Script
 *
 * Runs comprehensive pre-build checks to catch errors before deployment.
 * This script runs BEFORE the actual build to catch configuration issues early.
 *
 * Checks:
 * - Node modules installed
 * - Required dependencies present
 * - Critical files exist
 * - Database schema exists
 * - Environment variables configured
 * - Vercel configuration valid
 * - Git status (warnings only)
 *
 * Note: TypeScript and ESLint are checked by Next.js during the actual build,
 * not here, to ensure we use the exact same checks as Vercel deployment.
 *
 * Usage:
 *   npm run pre-deploy (runs this + build)
 *   tsx scripts/validate-build.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load .env.local file if it exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  error?: string;
}

const results: CheckResult[] = [];

/**
 * Execute a command and return success status
 */
function runCommand(command: string, description: string): boolean {
  try {
    console.log(`${colors.cyan}Running: ${description}...${colors.reset}`);
    execSync(command, {
      cwd: process.cwd(),
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return true;
  } catch (error: any) {
    return false;
  }
}

/**
 * Check if a file exists
 */
function fileExists(filePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

/**
 * Check TypeScript compilation (via Next.js build)
 * Note: We don't run a separate tsc check because Next.js has its own TypeScript handling
 * This check will be done by the actual build command
 */
function checkTypeScript(): CheckResult {
  return {
    name: 'TypeScript',
    passed: true,
    message: 'Will be checked during Next.js build',
  };
}

/**
 * Check ESLint (via Next.js build)
 * Note: ESLint is run during Next.js build if configured
 * We don't run it separately to avoid duplicate checks
 */
function checkESLint(): CheckResult {
  return {
    name: 'ESLint',
    passed: true,
    message: 'Will be checked during Next.js build',
  };
}

/**
 * Check critical files existence
 */
function checkCriticalFiles(): CheckResult {
  const criticalFiles = [
    'package.json',
    'next.config.ts',
    'tsconfig.json',
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/lib/posts.ts',
    'src/lib/posts-storage.ts',
    'src/lib/users.ts',
    'src/lib/auth/jwt.ts',
    '.env.example',
  ];

  const missingFiles = criticalFiles.filter(file => !fileExists(file));

  if (missingFiles.length > 0) {
    return {
      name: 'Critical Files',
      passed: false,
      message: `Missing ${missingFiles.length} critical file(s)`,
      error: `Missing files:\n${missingFiles.map(f => `  - ${f}`).join('\n')}`,
    };
  }

  return {
    name: 'Critical Files',
    passed: true,
    message: 'All critical files present',
  };
}

/**
 * Check package.json for required dependencies
 */
function checkDependencies(): CheckResult {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
    );

    const requiredDeps = [
      'next',
      'react',
      'react-dom',
      '@vercel/blob',
      '@vercel/postgres',
      'bcryptjs',
      'jsonwebtoken',
      'react-markdown',
      'tailwindcss',
    ];

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const missingDeps = requiredDeps.filter(dep => !allDeps[dep]);

    if (missingDeps.length > 0) {
      return {
        name: 'Dependencies',
        passed: false,
        message: `Missing ${missingDeps.length} required dependencies`,
        error: `Missing:\n${missingDeps.map(d => `  - ${d}`).join('\n')}\nRun: npm install`,
      };
    }

    return {
      name: 'Dependencies',
      passed: true,
      message: 'All required dependencies present',
    };
  } catch (error) {
    return {
      name: 'Dependencies',
      passed: false,
      message: 'Failed to read package.json',
      error: 'Ensure package.json exists and is valid JSON',
    };
  }
}

/**
 * Check node_modules exists
 */
function checkNodeModules(): CheckResult {
  if (!fileExists('node_modules')) {
    return {
      name: 'Node Modules',
      passed: false,
      message: 'node_modules directory not found',
      error: 'Run "npm install" to install dependencies',
    };
  }

  return {
    name: 'Node Modules',
    passed: true,
    message: 'Dependencies installed',
  };
}

/**
 * Check environment variables
 */
function checkEnvironment(): CheckResult {
  try {
    // Run the environment validation script
    execSync('tsx scripts/validate-env.ts', {
      cwd: process.cwd(),
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    return {
      name: 'Environment Variables',
      passed: true,
      message: 'Environment variables validated',
    };
  } catch (error: any) {
    return {
      name: 'Environment Variables',
      passed: false,
      message: 'Environment validation failed',
      error: 'Run "npm run validate:env" to see details',
    };
  }
}

/**
 * Check database schema file
 */
function checkDatabaseSchema(): CheckResult {
  if (!fileExists('src/lib/db/schema.sql')) {
    return {
      name: 'Database Schema',
      passed: false,
      message: 'Database schema file missing',
      error: 'src/lib/db/schema.sql is required for database initialization',
    };
  }

  return {
    name: 'Database Schema',
    passed: true,
    message: 'Database schema file present',
  };
}

/**
 * Check Vercel configuration validity
 */
function checkVercelConfig(): CheckResult {
  if (!fileExists('vercel.json')) {
    return {
      name: 'Vercel Config',
      passed: true, // Optional file
      message: 'No vercel.json found (using defaults)',
    };
  }

  try {
    const vercelConfig = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf-8')
    );

    // Check if buildCommand is set correctly
    if (vercelConfig.buildCommand && vercelConfig.buildCommand !== 'npm run pre-deploy') {
      return {
        name: 'Vercel Config',
        passed: false,
        message: 'Invalid buildCommand in vercel.json',
        error: `Expected "npm run pre-deploy", got "${vercelConfig.buildCommand}"`,
      };
    }

    return {
      name: 'Vercel Config',
      passed: true,
      message: 'Vercel configuration valid',
    };
  } catch (error) {
    return {
      name: 'Vercel Config',
      passed: false,
      message: 'Failed to parse vercel.json',
      error: 'Ensure vercel.json is valid JSON',
    };
  }
}

/**
 * Check git repository status (warn about uncommitted changes)
 */
function checkGitStatus(): CheckResult {
  try {
    // Check if git is initialized
    execSync('git rev-parse --git-dir', {
      cwd: process.cwd(),
      stdio: 'pipe',
    });

    // Check for uncommitted changes
    const status = execSync('git status --porcelain', {
      cwd: process.cwd(),
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    if (status.trim().length > 0) {
      const lines = status.trim().split('\n');
      return {
        name: 'Git Status',
        passed: true, // Warning only, not a failure
        message: `${lines.length} uncommitted change(s)`,
        error: 'Consider committing changes before deploying',
      };
    }

    return {
      name: 'Git Status',
      passed: true,
      message: 'Working directory clean',
    };
  } catch (error) {
    // Git not initialized or other error - not critical
    return {
      name: 'Git Status',
      passed: true,
      message: 'Git not initialized or unavailable',
    };
  }
}

/**
 * Print check results
 */
function printResults() {
  console.log(`\n${colors.bold}${colors.cyan}=== Build Validation Results ===${colors.reset}\n`);

  let failures = 0;
  let warnings = 0;

  results.forEach((result, index) => {
    const icon = result.passed ? '✓' : '✗';
    const color = result.passed ? colors.green : colors.red;

    console.log(`${color}${icon} ${result.name}${colors.reset}`);
    console.log(`  ${result.message}`);

    if (result.error) {
      if (result.passed) {
        warnings++;
        console.log(`  ${colors.yellow}⚠ ${result.error}${colors.reset}`);
      } else {
        failures++;
        console.log(`  ${colors.red}✗ ${result.error}${colors.reset}`);
      }
    }

    if (index < results.length - 1) {
      console.log();
    }
  });

  console.log();

  if (failures > 0) {
    console.log(`${colors.red}${colors.bold}✗ Build validation failed with ${failures} error(s)${colors.reset}`);
    if (warnings > 0) {
      console.log(`${colors.yellow}⚠ Also found ${warnings} warning(s)${colors.reset}`);
    }
    console.log();
    return false;
  } else if (warnings > 0) {
    console.log(`${colors.yellow}${colors.bold}⚠ Build validation passed with ${warnings} warning(s)${colors.reset}`);
    console.log(`${colors.cyan}Consider addressing warnings before deploying${colors.reset}`);
    console.log();
    return true;
  } else {
    console.log(`${colors.green}${colors.bold}✓ All checks passed! Ready to build.${colors.reset}`);
    console.log();
    return true;
  }
}

/**
 * Main validation function
 */
function main() {
  console.log(`${colors.cyan}${colors.bold}Starting pre-build validation...${colors.reset}`);
  console.log(`${colors.cyan}This matches what Vercel checks before running the build${colors.reset}\n`);

  // Run all checks in order of importance
  results.push(checkNodeModules());
  results.push(checkDependencies());
  results.push(checkCriticalFiles());
  results.push(checkDatabaseSchema());
  results.push(checkVercelConfig());
  results.push(checkEnvironment());
  results.push(checkTypeScript());
  results.push(checkESLint());
  results.push(checkGitStatus());

  // Print results
  const success = printResults();

  console.log(`${colors.cyan}Next step: Running Next.js build (same as Vercel)...${colors.reset}\n`);

  // Exit with error code if validation failed
  if (!success) {
    process.exit(1);
  }
}

// Run validation
main();
