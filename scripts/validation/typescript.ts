import * as fs from "fs";
import { ValidationResult, ValidationContext, colors } from "./types";
import { addResult, runCommand } from "./utils";

export function validateTypeScript(
  results: ValidationResult[],
  context: ValidationContext,
) {
  console.log(
    `\n${colors.cyan}[1/10] TypeScript Compilation...${colors.reset}`,
  );

  // Check strict mode in tsconfig
  try {
    const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf-8"));
    const isStrict = tsconfig.compilerOptions?.strict === true;

    addResult(
      results,
      context,
      "TypeScript",
      "Strict Mode",
      isStrict,
      true,
      isStrict ? "Strict mode enabled" : "Strict mode must be enabled",
      isStrict ? undefined : 'Enable "strict": true in tsconfig.json',
    );
  } catch (e) {
    addResult(
      results,
      context,
      "TypeScript",
      "tsconfig.json",
      false,
      true,
      "Cannot read tsconfig.json",
      "File may be missing or invalid",
    );
  }

  // Run TypeScript compiler with strict checks
  console.log("  Running tsc --noEmit...");
  const tscResult = runCommand("npx tsc --noEmit --pretty false", true);

  if (tscResult.success) {
    addResult(
      results,
      context,
      "TypeScript",
      "Compilation",
      true,
      true,
      "No type errors found",
    );
  } else {
    const errorCount = (tscResult.output.match(/error TS/g) || []).length;
    addResult(
      results,
      context,
      "TypeScript",
      "Compilation",
      false,
      true,
      `Found ${errorCount} type error(s)`,
      tscResult.output.split("\n").slice(0, 20).join("\n"),
    );
  }

  // Check for 'any' types in critical files
  console.log("  Checking for unsafe any types...");
  const criticalFiles = [
    "src/lib/auth/**/*.ts",
    "src/lib/db/**/*.ts",
    "src/lib/users/**/*.ts",
    "src/lib/posts/**/*.ts",
  ];

  for (const pattern of criticalFiles) {
    try {
      const result = runCommand(
        `grep -r ": any\\|: any\\[\\]\\|as any" ${pattern} 2>/dev/null || true`,
        true,
      );
      if (result.output.trim()) {
        addResult(
          results,
          context,
          "TypeScript",
          "Type Safety",
          false,
          false,
          `Found 'any' types in ${pattern}`,
          "Consider using proper types instead of any for better type safety",
        );
      }
    } catch (e) {
      // Ignore if files don't exist
    }
  }
}
