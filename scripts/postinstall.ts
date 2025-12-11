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

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";
import { execSync } from "child_process";

const projectRoot = join(__dirname, "..");
const envPath = join(projectRoot, ".env.local");
const envExamplePath = join(projectRoot, ".env.example");
const dataDir = join(projectRoot, "data");

// Common PostgreSQL binary locations (Homebrew, system, etc.)
const pgBinPaths = [
  "/opt/homebrew/opt/postgresql@16/bin",
  "/opt/homebrew/opt/postgresql@15/bin",
  "/opt/homebrew/opt/postgresql@14/bin",
  "/opt/homebrew/opt/postgresql/bin",
  "/usr/local/opt/postgresql@16/bin",
  "/usr/local/opt/postgresql@15/bin",
  "/usr/local/opt/postgresql@14/bin",
  "/usr/local/opt/postgresql/bin",
  "/usr/local/pgsql/bin",
  "/usr/pgsql-16/bin",
  "/usr/pgsql-15/bin",
  "/usr/pgsql-14/bin",
  "/usr/lib/postgresql/16/bin",
  "/usr/lib/postgresql/15/bin",
  "/usr/lib/postgresql/14/bin",
];

/**
 * Find PostgreSQL binary path
 */
function findPgBinPath(): string | null {
  // First check if psql is in PATH
  try {
    const whichCmd = process.platform === "win32" ? "where psql" : "which psql";
    const result = execSync(whichCmd, { stdio: "pipe", encoding: "utf-8" });
    const psqlPath = result.trim().split("\n")[0];
    if (psqlPath && existsSync(psqlPath)) {
      return join(psqlPath, "..");
    }
  } catch {
    // Not in PATH, check common locations
  }

  // Check common installation paths
  for (const binPath of pgBinPaths) {
    const psqlPath = join(binPath, "psql");
    if (existsSync(psqlPath)) {
      return binPath;
    }
  }

  return null;
}

/**
 * Execute a PostgreSQL command with the correct binary path
 */
function execPgCommand(
  command: string,
  pgBinPath: string,
  options: { timeout?: number } = {},
): string {
  const env = {
    ...process.env,
    PATH: `${pgBinPath}:${process.env.PATH}`,
  };
  return execSync(command, {
    stdio: "pipe",
    encoding: "utf-8",
    timeout: options.timeout || 10000,
    env,
  });
}

// Skip postinstall in CI/CD environments
if (process.env.CI || process.env.VERCEL || process.env.GITHUB_ACTIONS) {
  console.log("[INFO] Skipping postinstall in CI/CD environment");
  process.exit(0);
}

console.log("\n[SETUP] Running automated setup...\n");

// Step 1: Create data directory
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log("[OK] Created data/ directory");
}

// Step 2: Create .env.local if it doesn't exist
const isNewEnv = !existsSync(envPath);
if (isNewEnv) {
  console.log("[INFO] Creating .env.local with secure defaults...");

  // Generate secure JWT secret
  const jwtSecret = randomBytes(32).toString("base64");

  // Read .env.example as template
  let envContent = existsSync(envExamplePath)
    ? readFileSync(envExamplePath, "utf-8")
    : "";

  // Replace placeholder values with secure defaults
  envContent = envContent
    .replace(/ADMIN_PASSWORD=.*/g, `ADMIN_PASSWORD=admin123`)
    .replace(/JWT_SECRET=.*/g, `JWT_SECRET=${jwtSecret}`)
    .replace(
      /NEXT_PUBLIC_SITE_URL=.*/g,
      `NEXT_PUBLIC_SITE_URL=http://localhost:3000`,
    )
    .replace(/SESSION_DURATION=.*/g, `SESSION_DURATION=604800`)
    .replace(/BLOB_READ_WRITE_TOKEN=.*/g, `BLOB_READ_WRITE_TOKEN=`)
    .replace(/POSTGRES_URL=$/gm, `POSTGRES_URL=`);

  writeFileSync(envPath, envContent);
  console.log("[OK] Created .env.local with secure JWT secret");
  console.log(
    "[WARNING] Default admin password: admin123 (change this in .env.local)",
  );
} else {
  console.log("[OK] .env.local already exists");
}

// Step 3: Auto-detect and configure PostgreSQL
console.log("\n[INFO] Detecting PostgreSQL...");

let hasPostgres = false;
let dbConfigured = false;
let pgBinPath: string | null = null;

// Check if POSTGRES_URL is already configured (with actual value)
const existingEnvContent = readFileSync(envPath, "utf-8");
const postgresUrlMatch = existingEnvContent.match(
  /POSTGRES_URL=(postgres(?:ql)?:\/\/.+)/,
);

if (postgresUrlMatch && postgresUrlMatch[1]) {
  console.log("[OK] PostgreSQL already configured in .env.local");
  dbConfigured = true;
  hasPostgres = true;
  pgBinPath = findPgBinPath();
} else {
  // Try to detect PostgreSQL installation
  pgBinPath = findPgBinPath();
  if (pgBinPath) {
    hasPostgres = true;
    console.log(`[OK] PostgreSQL detected at ${pgBinPath}`);

    // Check if PostgreSQL service is running, try to start it if not
    try {
      execPgCommand(`psql -c "SELECT 1" -t`, pgBinPath, { timeout: 5000 });
      console.log("[OK] PostgreSQL service is running");
    } catch {
      console.log(
        "[INFO] PostgreSQL service not running, attempting to start...",
      );
      try {
        // Try brew services first (macOS)
        execSync(
          "brew services start postgresql@16 2>/dev/null || brew services start postgresql@15 2>/dev/null || brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null",
          {
            stdio: "pipe",
            timeout: 15000,
          },
        );
        // Wait for service to start
        execSync("sleep 2", { stdio: "pipe" });
        console.log("[OK] PostgreSQL service started");
      } catch {
        // Try pg_ctl as fallback
        try {
          const dataDir =
            process.platform === "darwin"
              ? "/opt/homebrew/var/postgresql@16"
              : "/var/lib/postgresql/data";
          execPgCommand(
            `pg_ctl -D "${dataDir}" start -l /tmp/postgres.log`,
            pgBinPath,
            { timeout: 10000 },
          );
          execSync("sleep 2", { stdio: "pipe" });
          console.log("[OK] PostgreSQL service started via pg_ctl");
        } catch {
          console.log("[WARNING] Could not start PostgreSQL service");
          console.log(
            "   Please start PostgreSQL manually and run: pnpm run setup",
          );
        }
      }
    }
  } else {
    console.log("[WARNING] PostgreSQL not detected");
    console.log("   App will run in admin-only mode (posts stored locally)");
    console.log(
      "   To enable full features, install PostgreSQL and run: pnpm run setup",
    );
  }
}

// Step 4: Auto-configure database if PostgreSQL is available and not already configured
if (hasPostgres && !dbConfigured && pgBinPath) {
  console.log("\n[INFO] Configuring local database...");

  const dbName = "school_newspaper";
  const dbUser = process.env.USER || "postgres";
  const dbHost = "localhost";
  const dbPort = "5432";

  try {
    // Try to create the database (will fail silently if exists)
    console.log(`   Creating database "${dbName}"...`);
    let dbCreated = false;

    // First try with current user (peer authentication)
    try {
      execPgCommand(`createdb ${dbName}`, pgBinPath, { timeout: 5000 });
      console.log(`   [OK] Created database "${dbName}"`);
      dbCreated = true;
    } catch (createError) {
      const errorOutput =
        createError instanceof Error
          ? createError.message
          : String(createError);
      if (errorOutput.includes("already exists")) {
        console.log(`   [OK] Database "${dbName}" already exists`);
        dbCreated = true;
      } else {
        // Try with explicit user/host
        try {
          execPgCommand(
            `createdb -U ${dbUser} -h ${dbHost} -p ${dbPort} ${dbName}`,
            pgBinPath,
            { timeout: 5000 },
          );
          console.log(`   [OK] Created database "${dbName}"`);
          dbCreated = true;
        } catch (retryError) {
          const retryOutput =
            retryError instanceof Error
              ? retryError.message
              : String(retryError);
          if (retryOutput.includes("already exists")) {
            console.log(`   [OK] Database "${dbName}" already exists`);
            dbCreated = true;
          } else {
            console.log(
              `   [WARNING] Could not create database (may already exist)`,
            );
          }
        }
      }
    }

    // Build connection string
    const dbUrl = `postgres://${dbUser}@${dbHost}:${dbPort}/${dbName}`;

    // Test connection
    console.log("   Testing database connection...");
    try {
      execPgCommand(`psql "${dbUrl}" -c "SELECT 1" -t`, pgBinPath, {
        timeout: 5000,
      });

      // Connection successful, add to .env.local
      let envContent = readFileSync(envPath, "utf-8");
      envContent = envContent.replace(
        /POSTGRES_URL=$/m,
        `POSTGRES_URL=${dbUrl}`,
      );
      envContent = envContent.replace(
        /POSTGRES_URL_NON_POOLING=$/m,
        `POSTGRES_URL_NON_POOLING=${dbUrl}`,
      );

      writeFileSync(envPath, envContent);
      console.log("   [OK] Database connection configured");
      dbConfigured = true;
    } catch {
      console.log("   [WARNING] Could not connect to database");
      console.log("   App will run in admin-only mode");
      console.log("   For manual setup, run: pnpm run setup");
    }
  } catch {
    console.log("   [WARNING] Database auto-configuration failed");
    console.log("   App will run in admin-only mode");
  }
}

// Step 5: Initialize database schema if database is configured
if (dbConfigured) {
  console.log("\n[INFO] Checking database schema...");
  try {
    // Re-read .env.local to get POSTGRES_URL
    const envContent = readFileSync(envPath, "utf-8");
    const dbUrlMatch = envContent.match(
      /POSTGRES_URL=(postgres(?:ql)?:\/\/.+)/,
    );

    if (dbUrlMatch && dbUrlMatch[1]) {
      const dbUrl = dbUrlMatch[1];
      process.env.POSTGRES_URL = dbUrl;
      process.env.POSTGRES_URL_NON_POOLING = dbUrl;

      // Check if schema is already initialized
      let schemaExists = false;
      try {
        if (pgBinPath) {
          execPgCommand(
            `psql "${dbUrl}" -c "SELECT 1 FROM users LIMIT 1" -t`,
            pgBinPath,
            { timeout: 5000 },
          );
        } else {
          execSync(`psql "${dbUrl}" -c "SELECT 1 FROM users LIMIT 1" -t`, {
            stdio: "pipe",
            timeout: 5000,
          });
        }
        console.log("[OK] Database schema already initialized");
        schemaExists = true;
      } catch {
        // Schema doesn't exist, initialize it
        console.log("[INFO] Initializing database schema...");

        // Run db:init using tsx directly
        const initEnv = {
          ...process.env,
          POSTGRES_URL: dbUrl,
          POSTGRES_URL_NON_POOLING: dbUrl,
          PATH: pgBinPath
            ? `${pgBinPath}:${process.env.PATH}`
            : process.env.PATH,
        };
        execSync("npx tsx scripts/init-db.ts --silent", {
          stdio: "pipe",
          cwd: projectRoot,
          env: initEnv,
          timeout: 15000,
        });

        console.log("[OK] Database schema initialized");
        schemaExists = true;
      }

      // Step 6: Create test user (always check)
      if (schemaExists) {
        console.log("\n[INFO] Checking test user...");
        const userEnv = {
          ...process.env,
          POSTGRES_URL: dbUrl,
          POSTGRES_URL_NON_POOLING: dbUrl,
          PATH: pgBinPath
            ? `${pgBinPath}:${process.env.PATH}`
            : process.env.PATH,
        };
        try {
          execSync("npx tsx scripts/create-test-user-simple.ts", {
            stdio: "pipe",
            cwd: projectRoot,
            env: userEnv,
            timeout: 15000,
          });
          console.log(
            "[OK] Test user created (username: user, password: 12345678)",
          );
        } catch {
          console.log("[OK] Test user already exists");
        }
      }
    }
  } catch {
    console.log("[WARNING] Database initialization skipped");
    console.log("   You can run manually: pnpm run db:init");
  }
}

// Step 8: Show completion message
console.log("\n" + "═".repeat(60));
console.log("[OK] Setup complete! Everything is ready to go.");
console.log("═".repeat(60));
console.log("\n[INFO] Start developing:\n");
console.log("   pnpm run dev");
console.log("\n   Then open http://localhost:3000\n");

if (dbConfigured) {
  console.log("[INFO] Test user credentials:");
  console.log("   Username: user");
  console.log("   Password: 12345678\n");
  console.log("[INFO] Admin panel access:");
  console.log("   URL: http://localhost:3000/admin");
  console.log("   Password: admin123 (from ADMIN_PASSWORD in .env.local)\n");
  console.log("[WARNING] Change passwords in production!\n");
} else {
  console.log("[INFO] Running in admin-only mode");
  console.log("   Access admin panel at: http://localhost:3000/admin");
  console.log("   Password: admin123\n");
}

console.log("[INFO] For more info, see CLAUDE.md or README.md\n");
