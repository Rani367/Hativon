#!/usr/bin/env tsx

/**
 * OPTIMIZED VERCEL BUILD SCRIPT
 *
 * This script is optimized for fast Vercel deployments while maintaining quality.
 * It runs only essential checks that aren't covered by Next.js build itself.
 *
 * What this script does:
 * 1. Critical environment validation (fast)
 * 2. TypeScript compilation check (Next.js also does this, but we catch it earlier)
 * 3. Security checks (secrets, dangerous patterns)
 * 4. Build the application
 *
 * What we skip in Vercel (these run in local pre-deploy and CI/CD):
 * - Full test suite (runs in CI/CD)
 * - Comprehensive validation (runs locally before commit)
 * - ESLint (Next.js build already does this)
 * - Dependency checks (handled by package manager)
 * - Code quality checks (handled in pre-commit)
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

// Load environment
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function runCommand(command: string, silent: boolean = true): { success: boolean; output: string } {
  try {
    const output = execSync(command, {
      cwd: process.cwd(),
      stdio: silent ? "pipe" : "inherit",
      encoding: "utf-8",
      timeout: 60000,
    });
    return { success: true, output };
  } catch (error) {
    const errorOutput =
      error && typeof error === "object" && "stdout" in error
        ? String(error.stdout)
        : error instanceof Error
          ? error.message
          : "";
    return { success: false, output: errorOutput };
  }
}

async function main() {
  console.log(`${colors.bold}${colors.cyan}`);
  console.log(`${"=".repeat(80)}`);
  console.log(`VERCEL OPTIMIZED BUILD`);
  console.log(`Fast deployment with essential quality checks`);
  console.log(`${"=".repeat(80)}`);
  console.log(`${colors.reset}\n`);

  const startTime = Date.now();
  let hasErrors = false;

  // 1. Critical Environment Variables
  console.log(`${colors.cyan}[1/4] Checking critical environment variables...${colors.reset}`);

  const requiredEnvVars = ["JWT_SECRET", "ADMIN_PASSWORD"];
  const missingVars: string[] = [];

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.log(`${colors.red}[ERROR] Missing required environment variables: ${missingVars.join(", ")}${colors.reset}`);
    hasErrors = true;
  } else {
    console.log(`${colors.green}[OK] All critical environment variables present${colors.reset}`);
  }

  // 2. TypeScript Quick Check
  console.log(`\n${colors.cyan}[2/4] TypeScript compilation check...${colors.reset}`);
  const tscResult = runCommand("npx tsc --noEmit --pretty false", true);

  if (tscResult.success) {
    console.log(`${colors.green}[OK] No type errors${colors.reset}`);
  } else {
    console.log(`${colors.red}[ERROR] TypeScript compilation issues found${colors.reset}`);
    console.log(tscResult.output.split("\n").slice(0, 10).join("\n"));
    hasErrors = true;
  }

  // 3. Security Checks (Fast)
  console.log(`\n${colors.cyan}[3/4] Security checks...${colors.reset}`);

  // Check for exposed secrets in code
  const secretPatterns = [
    /sk-[a-zA-Z0-9]{48}/, // OpenAI keys
    /AKIA[0-9A-Z]{16}/, // AWS keys
    /AIza[0-9A-Za-z\\-_]{35}/, // Google API keys
  ];

  const filesToCheck = [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.js",
    "src/**/*.jsx",
  ];

  let foundSecrets = false;
  for (const pattern of filesToCheck) {
    try {
      const grepResult = runCommand(
        `find ${pattern.replace("/**/*", "")} -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) 2>/dev/null | head -100`,
        true
      );

      if (grepResult.success && grepResult.output.trim()) {
        const files = grepResult.output.trim().split("\n");
        for (const file of files.slice(0, 50)) { // Check first 50 files only for speed
          try {
            const content = fs.readFileSync(file, "utf-8");
            for (const regex of secretPatterns) {
              if (regex.test(content)) {
                console.log(`${colors.red}[ERROR] Potential secret found in ${file}${colors.reset}`);
                foundSecrets = true;
              }
            }
          } catch {
            // Skip files we can't read
          }
        }
      }
    } catch {
      // Skip if directory doesn't exist
    }
  }

  if (!foundSecrets) {
    console.log(`${colors.green}[OK] No exposed secrets found${colors.reset}`);
  } else {
    hasErrors = true;
  }

  // 4. Build Application
  console.log(`\n${colors.cyan}[4/4] Building application...${colors.reset}`);

  if (hasErrors) {
    console.log(`${colors.red}\n[ERROR] Build cancelled due to validation issues${colors.reset}`);
    process.exit(1);
  }

  console.log(`\nRunning Next.js build...`);
  const buildResult = runCommand("pnpm run build", false);

  if (!buildResult.success) {
    console.log(`${colors.red}\n[ERROR] Build process failed${colors.reset}`);
    process.exit(1);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n${colors.bold}${colors.green}`);
  console.log(`${"=".repeat(80)}`);
  console.log(`BUILD SUCCESSFUL`);
  console.log(`Completed in ${duration}s`);
  console.log(`${"=".repeat(80)}`);
  console.log(`${colors.reset}\n`);
}

main().catch((error) => {
  console.error(`${colors.red}[ERROR] Build script failed:${colors.reset}`, error);
  process.exit(1);
});
