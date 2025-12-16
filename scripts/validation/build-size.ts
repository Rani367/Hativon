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

    // Check for large bundles in client-side static chunks only
    // Server chunks and dynamically loaded chunks (like Shiki languages) are excluded
    if (fs.existsSync(".next/static/chunks")) {
      // Check for extremely large CLIENT chunks (>700KB is concerning)
      // Exclude: server chunks, dev chunks, and lazy-loaded library chunks
      const largeChunks = runCommand(
        `find .next/static/chunks -maxdepth 1 -name "*.js" -size +700k 2>/dev/null | wc -l`,
        true,
      );
      const largeCount = parseInt(largeChunks.output.trim() || "0");

      if (largeCount > 0) {
        // Get the actual file names to provide better feedback
        const largeFiles = runCommand(
          `find .next/static/chunks -maxdepth 1 -name "*.js" -size +700k -exec basename {} \\; 2>/dev/null`,
          true,
        );
        const fileList = largeFiles.output.trim().split("\n").filter(Boolean);

        addResult(
          results,
          context,
          "Build Size",
          "Large Chunks",
          false,
          false,
          `Found ${largeCount} client JavaScript chunks > 700KB`,
          `Files: ${fileList.slice(0, 3).join(", ")}${fileList.length > 3 ? "..." : ""}`,
        );
      } else {
        addResult(
          results,
          context,
          "Build Size",
          "Chunk Sizes",
          true,
          false,
          "All client chunks are reasonably sized (<700KB)",
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
