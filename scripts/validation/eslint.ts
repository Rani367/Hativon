import * as fs from "fs";
import { ValidationResult, ValidationContext, colors } from "./types";
import { addResult, runCommand } from "./utils";

export function validateESLint(
  results: ValidationResult[],
  context: ValidationContext,
) {
  console.log(`\n${colors.cyan}[2/10] ESLint Checking...${colors.reset}`);

  // Check if .eslintrc exists
  const hasEslintConfig =
    fs.existsSync(".eslintrc.json") ||
    fs.existsSync(".eslintrc.js") ||
    fs.existsSync("eslint.config.js");

  if (!hasEslintConfig) {
    addResult(
      results,
      context,
      "ESLint",
      "Configuration",
      false,
      false,
      "No ESLint configuration found",
      "Run: npx eslint --init",
    );
    return;
  }

  console.log("  Running ESLint...");
  const eslintResult = runCommand("npx eslint . --ext .ts,.tsx,.js,.jsx", true);

  if (eslintResult.success) {
    addResult(
      results,
      context,
      "ESLint",
      "Linting",
      true,
      false,
      "No linting errors",
    );
  } else {
    // Count errors and warnings
    const errorMatches = eslintResult.output.match(/\d+ errors?/gi);
    const warningMatches = eslintResult.output.match(/\d+ warnings?/gi);

    const errors = errorMatches
      ? parseInt(errorMatches[0].match(/\d+/)?.[0] || "0")
      : 0;
    const warnings = warningMatches
      ? parseInt(warningMatches[0].match(/\d+/)?.[0] || "0")
      : 0;

    // Only fail on errors, warnings are OK
    if (errors > 0) {
      addResult(
        results,
        context,
        "ESLint",
        "Linting",
        false,
        true,
        `Found ${errors} linting error(s)`,
        eslintResult.output
          .split("\n")
          .filter((l) => l.includes("error"))
          .slice(0, 10)
          .join("\n"),
      );
    } else if (warnings > 0) {
      addResult(
        results,
        context,
        "ESLint",
        "Linting",
        true,
        false,
        `No errors (${warnings} warnings are acceptable)`,
        "Warnings are for code quality improvements",
      );
    }
  }
}
