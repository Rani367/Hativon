#!/usr/bin/env tsx

/**
 * COMPREHENSIVE PRE-DEPLOYMENT VALIDATION
 *
 * This script performs exhaustive checks to catch ANY error before production.
 * NO ERROR should make it to production.
 *
 * Categories:
 * 1. TypeScript strict compilation
 * 2. ESLint strict checking (fail on errors)
 * 3. Security scanning (secrets, vulnerabilities, dangerous patterns)
 * 4. Import validation (circular dependencies, unused imports)
 * 5. Database validation (schema, connection if available)
 * 6. Configuration validation (Next.js, package.json, tsconfig)
 * 7. Runtime validation (API routes, critical paths)
 * 8. Dependency validation (versions, vulnerabilities, licenses)
 * 9. Code quality (complexity, TODOs in critical files)
 * 10. Build size validation
 * 11. File size validation (500-line limit)
 */

import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";
import {
  ValidationResult,
  ValidationContext,
  colors,
} from "./validation/types";
import { validateTypeScript } from "./validation/typescript";
import { validateESLint } from "./validation/eslint";
import { validateSecurity } from "./validation/security";
import { validateImports } from "./validation/imports";
import { validateDatabase } from "./validation/database";
import { validateConfiguration } from "./validation/configuration";
import { validateRuntime } from "./validation/runtime";
import { validateDependencies } from "./validation/dependencies";
import { validateCodeQuality } from "./validation/code-quality";
import { validateBuildSize } from "./validation/build-size";
import { validateFileSize } from "./validation/file-size";
import { validateMarkdownFiles } from "./validation/markdown-files";
import { printResults } from "./validation/print-results";

// Load environment
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

async function main() {
  console.log(`${colors.bold}${colors.cyan}`);
  console.log(`${"=".repeat(80)}`);
  console.log(`COMPREHENSIVE PRE-DEPLOYMENT VALIDATION`);
  console.log(`Ensuring production-ready code quality`);
  console.log(`${"=".repeat(80)}`);
  console.log(`${colors.reset}\n`);

  const startTime = Date.now();

  // Initialize validation context
  const results: ValidationResult[] = [];
  const context: ValidationContext = {
    results,
    totalChecks: 0,
    passedChecks: 0,
    criticalFailures: 0,
  };

  // Run all validations
  validateTypeScript(results, context);
  validateESLint(results, context);
  validateSecurity(results, context);
  validateImports(results, context);
  validateDatabase(results, context);
  validateConfiguration(results, context);
  validateRuntime(results, context);
  validateDependencies(results, context);
  validateCodeQuality(results, context);
  validateBuildSize(results, context);
  validateFileSize(results, context);
  await validateMarkdownFiles(results, context);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print results
  const success = printResults(results, context);

  console.log(`Validation completed in ${duration}s\n`);

  if (!success) {
    process.exit(1);
  }
}

main();
