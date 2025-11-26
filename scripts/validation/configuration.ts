import * as fs from "fs";
import { ValidationResult, ValidationContext, colors } from "./types";
import { addResult } from "./utils";

export function validateConfiguration(
  results: ValidationResult[],
  context: ValidationContext,
) {
  console.log(
    `\n${colors.cyan}[6/10] Configuration Validation...${colors.reset}`,
  );

  // Validate package.json
  try {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));

    // Check required scripts
    const requiredScripts = ["dev", "build", "start", "lint"];
    const missingScripts = requiredScripts.filter((s) => !pkg.scripts?.[s]);

    if (missingScripts.length > 0) {
      addResult(
        results,
        context,
        "Config",
        "package.json scripts",
        false,
        true,
        `Missing scripts: ${missingScripts.join(", ")}`,
        "Add missing scripts to package.json",
      );
    } else {
      addResult(
        results,
        context,
        "Config",
        "package.json",
        true,
        true,
        "All required scripts present",
      );
    }

    // Check package manager
    if (pkg.packageManager && !pkg.packageManager.startsWith("pnpm")) {
      addResult(
        results,
        context,
        "Config",
        "Package Manager",
        false,
        false,
        "Package manager is not pnpm",
        `Current: ${pkg.packageManager}. Project uses pnpm.`,
      );
    } else {
      addResult(
        results,
        context,
        "Config",
        "Package Manager",
        true,
        false,
        "Using pnpm",
      );
    }
  } catch (e) {
    addResult(
      results,
      context,
      "Config",
      "package.json",
      false,
      true,
      "Invalid package.json",
      "Cannot parse package.json",
    );
  }

  // Validate Next.js config
  const nextConfigPath = "next.config.ts";
  if (!fs.existsSync(nextConfigPath)) {
    addResult(
      results,
      context,
      "Config",
      "next.config",
      false,
      true,
      "next.config.ts not found",
      "Next.js configuration required",
    );
  } else {
    // Just check the file exists and can be read - don't compile it with node_modules
    try {
      const configContent = fs.readFileSync(nextConfigPath, "utf-8");

      // Check for basic syntax issues
      if (
        configContent.includes("export default") ||
        configContent.includes("module.exports")
      ) {
        addResult(
          results,
          context,
          "Config",
          "next.config",
          true,
          true,
          "Next.js config exists and has export",
        );
      } else {
        addResult(
          results,
          context,
          "Config",
          "next.config",
          false,
          true,
          "Next.js config missing export",
          "Config must export default or module.exports",
        );
      }
    } catch (e) {
      addResult(
        results,
        context,
        "Config",
        "next.config",
        false,
        true,
        "Cannot read next.config.ts",
        "File may be corrupted",
      );
    }
  }

  // Validate tsconfig.json
  try {
    const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf-8"));

    // Check critical compiler options
    const criticalOptions = ["strict", "noEmit", "esModuleInterop"];
    const missingOptions = criticalOptions.filter(
      (opt) => !tsconfig.compilerOptions?.[opt],
    );

    if (missingOptions.length > 0) {
      addResult(
        results,
        context,
        "Config",
        "tsconfig.json",
        false,
        false,
        `Missing recommended options: ${missingOptions.join(", ")}`,
        "Consider enabling these TypeScript options",
      );
    } else {
      addResult(
        results,
        context,
        "Config",
        "tsconfig.json",
        true,
        false,
        "TypeScript config is properly configured",
      );
    }

    // Check paths are configured
    if (!tsconfig.compilerOptions?.paths?.["@/*"]) {
      addResult(
        results,
        context,
        "Config",
        "tsconfig paths",
        false,
        false,
        "Path alias @/* not configured",
        'Add "@/*": ["./src/*"] to paths',
      );
    } else {
      addResult(
        results,
        context,
        "Config",
        "tsconfig paths",
        true,
        false,
        "Path aliases configured",
      );
    }
  } catch (e) {
    addResult(
      results,
      context,
      "Config",
      "tsconfig.json",
      false,
      true,
      "Cannot parse tsconfig.json",
      "File may be invalid JSON",
    );
  }

  // Validate .env.example exists
  if (!fs.existsSync(".env.example")) {
    addResult(
      results,
      context,
      "Config",
      ".env.example",
      false,
      false,
      ".env.example not found",
      "Required for documentation",
    );
  } else {
    const envExample = fs.readFileSync(".env.example", "utf-8");
    const requiredVars = [
      "ADMIN_PASSWORD",
      "JWT_SECRET",
      "NEXT_PUBLIC_SITE_URL",
    ];
    const missingVars = requiredVars.filter((v) => !envExample.includes(v));

    if (missingVars.length > 0) {
      addResult(
        results,
        context,
        "Config",
        ".env.example",
        false,
        false,
        `Missing variables: ${missingVars.join(", ")}`,
        "Add all required environment variables to .env.example",
      );
    } else {
      addResult(
        results,
        context,
        "Config",
        ".env.example",
        true,
        false,
        ".env.example is complete",
      );
    }
  }
}
