import * as fs from "fs";
import { ValidationResult, ValidationContext, colors } from "./types";
import { addResult, runCommand } from "./utils";

export function validateCodeQuality(
  results: ValidationResult[],
  context: ValidationContext,
) {
  console.log(`\n${colors.cyan}[9/10] Code Quality Checks...${colors.reset}`);

  // Check for TODO/FIXME in critical paths
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

  // Check for proper error handling in API routes
  console.log("  Validating API exception handling...");
  if (fs.existsSync("src/app/api")) {
    const apiFiles = runCommand(`find src/app/api -name "route.ts"`, true)
      .output.trim()
      .split("\n")
      .filter((f) => f);

    let missingErrorHandling = 0;
    for (const file of apiFiles) {
      if (!file) continue;
      const content = fs.readFileSync(file, "utf-8");

      // Check if file has try-catch blocks or .catch() handlers
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
        `${missingErrorHandling} API routes missing exception handling`,
        "Add try-catch blocks or .catch() handlers",
      );
    } else {
      addResult(
        results,
        context,
        "Quality",
        "Exception Handling",
        true,
        false,
        "All API routes have exception handling",
      );
    }
  }

  // Check file/folder naming conventions
  console.log("  Validating naming conventions...");
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
      "Following Next.js naming conventions",
    );
  }

  // Check for emojis in code
  console.log("  Checking for emojis in code...");
  const emojiRegex =
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F910}-\u{1F96B}\u{1F980}-\u{1F9E0}]/u;

  const filesToCheck = runCommand(
    `find src scripts -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) 2>/dev/null || true`,
    true,
  )
    .output.trim()
    .split("\n")
    .filter((f) => f);

  let filesWithEmojis: string[] = [];
  let totalEmojisRemoved = 0;

  for (const file of filesToCheck) {
    if (!file || !fs.existsSync(file)) continue;

    let content = fs.readFileSync(file, "utf-8");
    const originalContent = content;

    // Check if file contains emojis
    if (emojiRegex.test(content)) {
      filesWithEmojis.push(file);

      // Remove all emojis
      const matches = content.match(new RegExp(emojiRegex, "gu")) || [];
      totalEmojisRemoved += matches.length;

      content = content.replace(new RegExp(emojiRegex, "gu"), "");

      // Write cleaned content back to file
      fs.writeFileSync(file, content, "utf-8");
      console.log(`    [FIX] Removed ${matches.length} emoji(s) from ${file}`);
    }
  }

  if (filesWithEmojis.length > 0) {
    addResult(
      results,
      context,
      "Quality",
      "No Emojis [CRITICAL]",
      true,
      true,
      `Auto-removed ${totalEmojisRemoved} emoji(s) from ${filesWithEmojis.length} file(s)`,
      `Fixed files:\n${filesWithEmojis.map((f) => `  - ${f}`).join("\n")}`,
    );
  } else {
    addResult(
      results,
      context,
      "Quality",
      "No Emojis [CRITICAL]",
      true,
      true,
      "No emojis found in code",
    );
  }
}
