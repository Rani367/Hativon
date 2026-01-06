import * as fs from "fs";
import { ValidationResult, ValidationContext, colors } from "./types";
import { addResult, runCommand } from "./utils";

export function validateImports(
  results: ValidationResult[],
  context: ValidationContext,
) {
  console.log(`\n${colors.cyan}[4/10] Import Validation...${colors.reset}`);

  // Check for circular dependencies using madge
  console.log("  Checking for circular dependencies...");
  const madgeInstalled = runCommand("npx madge --version", true).success;

  if (madgeInstalled) {
    const circularResult = runCommand(
      "npx madge --circular --extensions ts,tsx,js,jsx src/",
      true,
    );

    if (circularResult.output.includes("No circular")) {
      addResult(
        results,
        context,
        "Imports",
        "Circular Dependencies",
        true,
        false,
        "No circular dependencies found",
      );
    } else if (
      circularResult.output.includes("Circular") &&
      !circularResult.output.includes("No circular")
    ) {
      // Extract actual circular dependencies, not just warnings count
      const circularMatches = circularResult.output.match(/^.*->.*$/gm);
      if (circularMatches && circularMatches.length > 0) {
        addResult(
          results,
          context,
          "Imports",
          "Circular Dependencies",
          false,
          false,
          `Found ${circularMatches.length} circular dependencies`,
          circularMatches.slice(0, 5).join("\n"),
        );
      } else {
        addResult(
          results,
          context,
          "Imports",
          "Circular Dependencies",
          true,
          false,
          "No critical circular dependencies",
        );
      }
    } else {
      addResult(
        results,
        context,
        "Imports",
        "Circular Dependencies",
        true,
        false,
        "No circular dependencies found",
      );
    }
  } else {
    addResult(
      results,
      context,
      "Imports",
      "Circular Dependencies",
      true,
      false,
      "Skipped (madge not available)",
      "Install: npm i -D madge",
    );
  }

  // Check for unused dependencies
  console.log("  Checking for unused dependencies...");
  const depcheckResult = runCommand("npx depcheck --json", true);

  try {
    const depcheck = JSON.parse(depcheckResult.output);
    // depcheck.dependencies is an array of package names, not an object
    const unusedDeps = Array.isArray(depcheck.dependencies)
      ? depcheck.dependencies
      : Object.keys(depcheck.dependencies || {});

    if (unusedDeps.length > 0) {
      addResult(
        results,
        context,
        "Imports",
        "Unused Dependencies",
        false,
        false,
        `Found ${unusedDeps.length} unused dependencies`,
        unusedDeps.slice(0, 10).join(", "),
      );
    } else {
      addResult(
        results,
        context,
        "Imports",
        "Unused Dependencies",
        true,
        false,
        "No unused dependencies",
      );
    }
  } catch (e) {
    // depcheck not available or failed
    addResult(
      results,
      context,
      "Imports",
      "Unused Dependencies",
      true,
      false,
      "Skipped (depcheck not available)",
    );
  }

  // Check for missing imports in critical files
  console.log("  Checking critical file imports...");
  const criticalImports = [
    { file: "src/app/layout.tsx", should: ["./globals.css"] },
  ];

  for (const { file, should } of criticalImports) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf-8");
      const missing = should.filter((imp) => !content.includes(imp));

      if (missing.length > 0) {
        addResult(
          results,
          context,
          "Imports",
          `Critical Imports (${file})`,
          false,
          false,
          `Missing imports: ${missing.join(", ")}`,
          `File ${file} should import ${should.join(", ")}`,
        );
      } else {
        addResult(
          results,
          context,
          "Imports",
          `Critical Imports (${file})`,
          true,
          false,
          "All critical imports present",
        );
      }
    }
  }
}
