import * as fs from "fs";
import { ValidationResult, ValidationContext, colors } from "./types";
import { addResult, runCommand } from "./utils";

export function validateBuildSize(
  results: ValidationResult[],
  context: ValidationContext,
) {
  console.log(
    `\n${colors.cyan}[10/10] Build Size Validation...${colors.reset}`,
  );

  // Check if .next directory exists from a previous build
  if (!fs.existsSync(".next")) {
    addResult(
      results,
      context,
      "Build Size",
      "Check",
      true,
      false,
      "Skipped (no previous build)",
      "Will be checked after build",
    );
    return;
  }

  // Check bundle sizes if .next exists
  try {
    // Get size of .next directory
    const sizeResult = runCommand(`du -sh .next | awk '{print $1}'`, true);
    const buildSize = sizeResult.output.trim();

    addResult(
      results,
      context,
      "Build Size",
      "Total Build",
      true,
      false,
      `Build size: ${buildSize}`,
    );

    // Check for large bundles
    if (fs.existsSync(".next/static/chunks")) {
      // Check for extremely large chunks (>700KB is concerning for modern apps)
      // Note: 500-700KB is acceptable for rich apps with markdown/syntax highlighting
      const largeChunks = runCommand(
        `find .next/static/chunks -name "*.js" -size +700k | wc -l`,
        true,
      );
      const largeCount = parseInt(largeChunks.output.trim() || "0");

      if (largeCount > 0) {
        addResult(
          results,
          context,
          "Build Size",
          "Large Chunks",
          false,
          false,
          `Found ${largeCount} JavaScript chunks > 700KB`,
          "Consider code splitting or lazy loading",
        );
      } else {
        addResult(
          results,
          context,
          "Build Size",
          "Chunk Sizes",
          true,
          false,
          "All chunks are reasonably sized (<700KB)",
        );
      }
    }
  } catch (e) {
    addResult(
      results,
      context,
      "Build Size",
      "Check",
      true,
      false,
      "Could not check build size",
    );
  }
}
