import * as fs from "fs";
import * as path from "path";
import { ValidationResult, colors } from "./types";
import { addResult } from "./utils";

const MAX_LINES = 500;

export function validateFileSize(
  results: ValidationResult[],
  context: {
    totalChecks: number;
    passedChecks: number;
    criticalFailures: number;
  },
) {
  console.log(`\n${colors.cyan}[11/11] File Size Validation...${colors.reset}`);

  const filesToCheck: string[] = [];
  const excludeDirs = [
    "node_modules",
    ".next",
    "dist",
    "build",
    ".git",
    "coverage",
  ];

  function scanDirectory(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name)) {
            scanDirectory(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
            filesToCheck.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  // Scan src/ and scripts/ directories
  const dirsToScan = ["src", "scripts"];
  for (const dir of dirsToScan) {
    if (fs.existsSync(dir)) {
      scanDirectory(dir);
    }
  }

  console.log(
    `  Checking ${filesToCheck.length} files for ${MAX_LINES}-line limit...`,
  );

  const oversizedFiles: { file: string; lines: number }[] = [];

  for (const file of filesToCheck) {
    try {
      // Skip test files (__tests__ directories, .test.ts, .spec.ts)
      if (
        file.includes("__tests__") ||
        file.endsWith(".test.ts") ||
        file.endsWith(".test.tsx") ||
        file.endsWith(".spec.ts") ||
        file.endsWith(".spec.tsx")
      ) {
        continue;
      }

      const content = fs.readFileSync(file, "utf-8");
      const lineCount = content.split("\n").length;

      if (lineCount > MAX_LINES) {
        oversizedFiles.push({ file, lines: lineCount });
      }
    } catch (error) {
      // Skip files we can't read
    }
  }

  if (oversizedFiles.length === 0) {
    addResult(
      results,
      context,
      "File Size",
      "Line Count Limit",
      true,
      true,
      `All files under ${MAX_LINES} lines`,
    );
  } else {
    const fileList = oversizedFiles
      .map((f) => `  ${f.file} (${f.lines} lines)`)
      .join("\n");

    addResult(
      results,
      context,
      "File Size",
      "Line Count Limit",
      false,
      true,
      `Found ${oversizedFiles.length} file(s) exceeding ${MAX_LINES} lines`,
      `Files need refactoring:\n${fileList}\n\nRefactor these files into smaller modules to improve maintainability.`,
    );
  }

  console.log(
    `  ${colors.green}[OK]${colors.reset} File size validation complete`,
  );
}
