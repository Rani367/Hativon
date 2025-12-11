import * as fs from "fs";
import { ValidationResult, ValidationContext, colors } from "./types";
import { addResult, runCommand } from "./utils";

export function validateCodeQuality(
  results: ValidationResult[],
  context: ValidationContext,
) {
  console.log(`\n${colors.cyan}[9/10] Code Quality Checks...${colors.reset}`);

  // check for TODOs in critical paths
  console.log("  Checking for unresolved TODOs...");
  const criticalPaths = ["src/lib/auth", "src/lib/db", "src/app/api"];

  let todosFound = 0;
  for (const critPath of criticalPaths) {
    if (fs.existsSync(critPath)) {
      const todoResult = runCommand(
        `grep -r "TODO\\|FIXME\\|XXX\\|HACK" ${critPath} --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l`,
        true,
      );
      const count = parseInt(todoResult.output.trim() || "0");
      todosFound += count;
    }
  }

  if (todosFound > 0) {
    addResult(
      results,
      context,
      "Quality",
      "TODOs in Critical Code",
      false,
      false,
      `Found ${todosFound} TODO/FIXME comments in critical paths`,
      "Consider resolving before production deploy",
    );
  } else {
    addResult(
      results,
      context,
      "Quality",
      "TODOs",
      true,
      false,
      "No unresolved TODOs in critical code",
    );
  }

  // check API routes have error handling
  console.log("  Checking API error handling...");
  if (fs.existsSync("src/app/api")) {
    const apiFiles = runCommand(`find src/app/api -name "route.ts"`, true)
      .output.trim()
      .split("\n")
      .filter((f) => f);

    let missingErrorHandling = 0;
    for (const file of apiFiles) {
      if (!file) continue;
      const content = fs.readFileSync(file, "utf-8");

      const hasTryCatch = content.includes("try") && content.includes("catch");
      const hasCatchHandler = content.includes(".catch(");

      if (!hasTryCatch && !hasCatchHandler) {
        missingErrorHandling++;
      }
    }

    if (missingErrorHandling > 0) {
      addResult(
        results,
        context,
        "Quality",
        "Exception Handling",
        false,
        false,
        `${missingErrorHandling} API routes missing error handling`,
        "Add try-catch blocks",
      );
    } else {
      addResult(
        results,
        context,
        "Quality",
        "Exception Handling",
        true,
        false,
        "All API routes have error handling",
      );
    }
  }

  // check naming conventions
  console.log("  Checking naming conventions...");
  const badNames = runCommand(
    `find src -name "*[A-Z]*" -type f | grep -v ".tsx\\|.ts\\|node_modules\\|.DS_Store" || true`,
    true,
  );

  if (badNames.output.trim()) {
    addResult(
      results,
      context,
      "Quality",
      "Naming Conventions",
      false,
      false,
      "Found files with unconventional names",
      badNames.output.split("\n").slice(0, 5).join("\n"),
    );
  } else {
    addResult(
      results,
      context,
      "Quality",
      "Naming Conventions",
      true,
      false,
      "Naming conventions OK",
    );
  }
}
