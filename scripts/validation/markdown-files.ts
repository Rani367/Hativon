/**
 * Markdown File Validation
 *
 * Ensures only CLAUDE.md and README.md exist in the project root.
 * Any other .md files are NOT allowed.
 */

import { glob } from "glob";
import { ValidationResult, ValidationContext, colors } from "./types";
import { addResult } from "./utils";

const ALLOWED_MD_FILES = ["CLAUDE.md", "README.md"];

export async function validateMarkdownFiles(
  results: ValidationResult[],
  context: ValidationContext,
) {
  console.log(`\n${colors.cyan}[12/12] Markdown Files...${colors.reset}`);

  try {
    // Find all .md files in the project (excluding node_modules, .next, etc.)
    console.log("  Checking for disallowed markdown files...");
    const mdFiles = await glob("**/*.md", {
      ignore: [
        "node_modules/**",
        ".next/**",
        "dist/**",
        "build/**",
        ".claude/**",
        ".github/**",
      ],
    });

    // Check for disallowed markdown files
    const disallowedFiles = mdFiles.filter(
      (file) => !ALLOWED_MD_FILES.includes(file),
    );

    if (disallowedFiles.length > 0) {
      const filesList = disallowedFiles.map((f) => `  - ${f}`).join("\n");
      addResult(
        results,
        context,
        "Markdown Files",
        "Disallowed Files",
        false,
        true,
        `Found ${disallowedFiles.length} disallowed markdown file(s)`,
        `${filesList}\n\nONLY CLAUDE.md and README.md are allowed.\nRemove these files or move content to CLAUDE.md/README.md.`,
      );
    } else {
      addResult(
        results,
        context,
        "Markdown Files",
        "Disallowed Files",
        true,
        true,
        "Only CLAUDE.md and README.md exist",
      );
    }

    // Verify required files exist
    console.log("  Checking for required markdown files...");
    const missingRequired = ALLOWED_MD_FILES.filter(
      (file) => !mdFiles.includes(file),
    );

    if (missingRequired.length > 0) {
      const missingList = missingRequired.map((f) => `  - ${f}`).join("\n");
      addResult(
        results,
        context,
        "Markdown Files",
        "Required Files",
        false,
        false,
        `Missing required markdown file(s)`,
        missingList,
      );
    } else {
      addResult(
        results,
        context,
        "Markdown Files",
        "Required Files",
        true,
        false,
        "All required markdown files exist",
      );
    }
  } catch (error) {
    addResult(
      results,
      context,
      "Markdown Files",
      "Validation",
      false,
      true,
      "Markdown file validation failed",
      error instanceof Error ? error.message : String(error),
    );
  }
}
