import * as fs from "fs";
import { ValidationResult, ValidationContext, colors } from "./types";
import { addResult, runCommand } from "./utils";

export function validateDependencies(
  results: ValidationResult[],
  context: ValidationContext,
) {
  console.log(`\n${colors.cyan}[8/10] Dependency Validation...${colors.reset}`);

  try {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));

    // Check for outdated critical dependencies
    console.log("  Checking dependency versions...");
    const criticalDeps = [
      "next",
      "react",
      "react-dom",
      "@vercel/postgres",
      "@vercel/blob",
    ];

    for (const dep of criticalDeps) {
      const version = pkg.dependencies?.[dep];
      if (!version) {
        addResult(
          results,
          context,
          "Dependencies",
          dep,
          false,
          true,
          `Missing critical dependency: ${dep}`,
          "Add to package.json",
        );
      } else if (version.includes("latest")) {
        addResult(
          results,
          context,
          "Dependencies",
          dep,
          false,
          false,
          `Using "latest" for ${dep}`,
          "Pin to specific version for reproducible builds",
        );
      }
    }

    // Check for beta/alpha versions in production
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const prerelease = Object.entries(allDeps).filter(([, version]) => {
      const versionStr = String(version);
      return (
        versionStr &&
        (versionStr.includes("alpha") ||
          versionStr.includes("beta") ||
          versionStr.includes("rc"))
      );
    });

    if (prerelease.length > 0) {
      addResult(
        results,
        context,
        "Dependencies",
        "Pre-release",
        false,
        false,
        `Found ${prerelease.length} pre-release dependencies`,
        prerelease.map(([name]) => name).join(", "),
      );
    } else {
      addResult(
        results,
        context,
        "Dependencies",
        "Versions",
        true,
        false,
        "All dependencies are stable versions",
      );
    }

    // Check for missing peer dependencies
    const peerDepResult = runCommand("npm ls 2>&1", true);
    if (peerDepResult.output.includes("UNMET PEER DEPENDENCY")) {
      addResult(
        results,
        context,
        "Dependencies",
        "Peer Dependencies",
        false,
        true,
        "Unmet peer dependencies detected",
        "Run: npm install to resolve",
      );
    } else {
      addResult(
        results,
        context,
        "Dependencies",
        "Peer Dependencies",
        true,
        false,
        "All peer dependencies met",
      );
    }
  } catch (e) {
    addResult(
      results,
      context,
      "Dependencies",
      "Validation",
      false,
      true,
      "Cannot validate dependencies",
      "package.json may be invalid",
    );
  }
}
