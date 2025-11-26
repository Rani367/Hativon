#!/usr/bin/env tsx

/**
 * Database Health Check Script
 *
 * Validates database connectivity and schema.
 * Can be run manually or as part of post-deployment checks.
 *
 * Checks:
 * - Database connectivity
 * - Required tables exist
 * - Schema matches expected structure
 * - Basic query functionality
 *
 * Usage:
 *   pnpm run check:db
 *   tsx scripts/check-db.ts
 */

import { sql } from "@vercel/postgres";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}

const results: CheckResult[] = [];

/**
 * Check if database is configured
 */
function isDatabaseConfigured(): boolean {
  return !!process.env.POSTGRES_URL;
}

/**
 * Check database connectivity
 */
async function checkConnectivity(): Promise<CheckResult> {
  try {
    await sql`SELECT 1 as test`;

    return {
      name: "Database Connectivity",
      passed: true,
      message: "Successfully connected to database",
    };
  } catch (error) {
    return {
      name: "Database Connectivity",
      passed: false,
      message: "Failed to connect to database",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check if users table exists
 */
async function checkUsersTable(): Promise<CheckResult> {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      ) as table_exists;
    `;

    const exists = result.rows[0]?.table_exists;

    if (!exists) {
      return {
        name: "Users Table",
        passed: false,
        message: "Users table does not exist",
        details: 'Run "pnpm run db:init" to initialize the database',
      };
    }

    return {
      name: "Users Table",
      passed: true,
      message: "Users table exists",
    };
  } catch (error) {
    return {
      name: "Users Table",
      passed: false,
      message: "Failed to check users table",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check users table schema
 */
async function checkUsersTableSchema(): Promise<CheckResult> {
  try {
    const result = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'users'
      ORDER BY ordinal_position;
    `;

    const columns = result.rows;
    const requiredColumns = [
      { name: "id", type: "uuid" },
      { name: "username", type: "character varying" },
      { name: "password_hash", type: "character varying" },
      { name: "display_name", type: "character varying" },
      { name: "role", type: "character varying" },
      { name: "created_at", type: "timestamp with time zone" },
    ];

    const missingColumns = requiredColumns.filter(
      (required) => !columns.some((col) => col.column_name === required.name),
    );

    if (missingColumns.length > 0) {
      return {
        name: "Users Table Schema",
        passed: false,
        message: "Users table schema is incomplete",
        details: `Missing columns: ${missingColumns.map((c) => c.name).join(", ")}\nRun "pnpm run db:init" to update schema`,
      };
    }

    return {
      name: "Users Table Schema",
      passed: true,
      message: "Users table schema is valid",
      details: `Found ${columns.length} columns`,
    };
  } catch (error) {
    return {
      name: "Users Table Schema",
      passed: false,
      message: "Failed to validate schema",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check for admin user
 */
async function checkAdminUser(): Promise<CheckResult> {
  try {
    const result = await sql`
      SELECT COUNT(*) as admin_count
      FROM users
      WHERE role = 'admin';
    `;

    const adminCount = parseInt(result.rows[0]?.admin_count || "0", 10);

    if (adminCount === 0) {
      return {
        name: "Admin User",
        passed: false,
        message: "No admin user found",
        details: 'Run "pnpm run create-admin" to create an admin account',
      };
    }

    return {
      name: "Admin User",
      passed: true,
      message: `Found ${adminCount} admin user(s)`,
    };
  } catch (error) {
    return {
      name: "Admin User",
      passed: false,
      message: "Failed to check admin users",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check database indexes
 */
async function checkIndexes(): Promise<CheckResult> {
  try {
    const result = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'users'
      AND schemaname = 'public';
    `;

    const indexes = result.rows.map((row) => row.indexname);

    // Check for username unique index
    const hasUsernameIndex = indexes.some(
      (idx) => idx.includes("username") || idx.includes("users_pkey"),
    );

    if (!hasUsernameIndex) {
      return {
        name: "Database Indexes",
        passed: false,
        message: "Missing username unique index",
        details: 'Run "pnpm run db:init" to create required indexes',
      };
    }

    return {
      name: "Database Indexes",
      passed: true,
      message: "Required indexes present",
      details: `Found ${indexes.length} index(es)`,
    };
  } catch (error) {
    return {
      name: "Database Indexes",
      passed: false,
      message: "Failed to check indexes",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Print check results
 */
function printResults() {
  console.log(
    `\n${colors.bold}${colors.cyan}=== Database Health Check ===${colors.reset}\n`,
  );

  let failures = 0;
  let warnings = 0;

  results.forEach((result, index) => {
    const icon = result.passed ? "[OK]" : "";
    const color = result.passed ? colors.green : colors.red;

    console.log(`${color}${icon} ${result.name}${colors.reset}`);
    console.log(`  ${result.message}`);

    if (result.details) {
      const detailColor = result.passed ? colors.cyan : colors.yellow;
      console.log(`  ${detailColor}${result.details}${colors.reset}`);
    }

    if (!result.passed) {
      failures++;
    }

    if (index < results.length - 1) {
      console.log();
    }
  });

  console.log();

  if (failures > 0) {
    console.log(
      `${colors.red}${colors.bold} Database check failed with ${failures} error(s)${colors.reset}`,
    );
    console.log(
      `${colors.cyan}Run the suggested commands to fix issues${colors.reset}`,
    );
    console.log();
    return false;
  } else {
    console.log(
      `${colors.green}${colors.bold}[OK] Database is healthy!${colors.reset}`,
    );
    console.log();
    return true;
  }
}

/**
 * Main check function
 */
async function main() {
  console.log(
    `${colors.cyan}${colors.bold}Checking database health...${colors.reset}\n`,
  );

  // Check if database is configured
  if (!isDatabaseConfigured()) {
    console.log(`${colors.yellow} Database not configured${colors.reset}`);
    console.log(
      `${colors.cyan}Set POSTGRES_URL environment variable to enable user authentication${colors.reset}`,
    );
    console.log(
      `${colors.cyan}System will run in admin-only mode without database${colors.reset}\n`,
    );
    return;
  }

  try {
    // Run all checks
    results.push(await checkConnectivity());

    // Only continue if we can connect
    if (results[0].passed) {
      results.push(await checkUsersTable());

      // Only check schema if table exists
      if (results[1].passed) {
        results.push(await checkUsersTableSchema());
        results.push(await checkIndexes());
        results.push(await checkAdminUser());
      }
    }

    // Print results
    const success = printResults();

    // Exit with error code if validation failed
    if (!success) {
      process.exit(1);
    }
  } catch (error) {
    console.log(
      `\n${colors.red}${colors.bold} Database check failed${colors.reset}`,
    );
    console.log(
      `${colors.red}${error instanceof Error ? error.message : String(error)}${colors.reset}\n`,
    );
    process.exit(1);
  }
}

// Run check
main();
