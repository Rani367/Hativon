import * as fs from "fs";
import { ValidationResult, ValidationContext, colors } from "./types";
import { addResult, runCommand } from "./utils";

export function validateRuntime(
  results: ValidationResult[],
  context: ValidationContext,
) {
  console.log(`\n${colors.cyan}[7/10] Runtime Validation...${colors.reset}`);

  // Check all API routes are properly structured
  console.log("  Validating API routes...");
  const apiRoutesPath = "src/app/api";

  if (fs.existsSync(apiRoutesPath)) {
    const findResult = runCommand(
      `find ${apiRoutesPath} -name "route.ts" -o -name "route.js"`,
      true,
    );
    const routes = findResult.output
      .trim()
      .split("\n")
      .filter((r) => r);

    let invalidRoutes = 0;
    for (const route of routes) {
      if (!route) continue;
      const content = fs.readFileSync(route, "utf-8");

      // Check for proper HTTP method exports
      const hasExport =
        /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/m.test(
          content,
        );
      if (!hasExport) {
        invalidRoutes++;
        addResult(
          results,
          context,
          "Runtime",
          `API Route ${route}`,
          false,
          true,
          "No HTTP method handlers found",
          "API routes must export GET, POST, PUT, DELETE, or PATCH functions",
        );
      }
    }

    if (invalidRoutes === 0) {
      addResult(
        results,
        context,
        "Runtime",
        "API Routes",
        true,
        true,
        `All ${routes.length} API routes properly structured`,
      );
    }
  } else {
    addResult(
      results,
      context,
      "Runtime",
      "API Routes",
      true,
      false,
      "No API routes found",
    );
  }

  // Check critical imports can be resolved
  console.log("  Checking module resolution...");
  const criticalModules = [
    "@/lib/auth/jwt",
    "@/lib/users",
    "@/lib/posts",
    "@/lib/db/client",
  ];

  for (const modulePath of criticalModules) {
    const basePath = `src/${modulePath.replace("@/", "")}`;
    const tsPath = `${basePath}.ts`;
    const indexPath = `${basePath}/index.ts`;

    const moduleExists = fs.existsSync(tsPath) || fs.existsSync(indexPath);
    const actualPath = fs.existsSync(tsPath)
      ? tsPath
      : fs.existsSync(indexPath)
        ? indexPath
        : tsPath;

    if (!moduleExists) {
      addResult(
        results,
        context,
        "Runtime",
        `Module ${modulePath}`,
        false,
        true,
        `Critical module not found: ${actualPath}`,
        "This module is imported by other files and must exist",
      );
    } else {
      addResult(
        results,
        context,
        "Runtime",
        `Module ${modulePath}`,
        true,
        true,
        `Module found at ${actualPath}`,
      );
    }
  }

  // Check for console.log/error in production code (should use proper logging)
  console.log("  Checking for debug statements...");
  const debugResult = runCommand(
    `grep -r "console\\.log\\|console\\.error\\|debugger" src/app src/components --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// " | wc -l`,
    true,
  );
  const debugCount = parseInt(debugResult.output.trim() || "0");

  if (debugCount > 20) {
    addResult(
      results,
      context,
      "Runtime",
      "Debug Statements",
      false,
      false,
      `Found ${debugCount} console.log/error statements`,
      "Consider using a proper logging system for production",
    );
  } else {
    addResult(
      results,
      context,
      "Runtime",
      "Debug Statements",
      true,
      false,
      "Reasonable amount of logging",
    );
  }
}
