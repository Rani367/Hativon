import * as fs from "fs";
import { ValidationResult, ValidationContext, colors } from "./types";
import { addResult, runCommand } from "./utils";

export function validateSecurity(
  results: ValidationResult[],
  context: ValidationContext,
) {
  console.log(`\n${colors.cyan}[3/10] Security Scanning...${colors.reset}`);

  // Check for exposed secrets in code
  console.log("  Checking for exposed secrets...");
  const secretPatterns = [
    { pattern: "AKIA[0-9A-Z]{16}", desc: "AWS access key" },
    { pattern: "sk_live_[0-9a-zA-Z]{24,}", desc: "Stripe live key" },
    { pattern: "ghp_[0-9a-zA-Z]{36}", desc: "GitHub token" },
  ];

  let foundSecrets = false;
  for (const { pattern, desc } of secretPatterns) {
    const result = runCommand(
      `grep -rE '${pattern}' src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true`,
      true,
    );
    if (result.output.trim() && !result.output.includes("Command failed")) {
      foundSecrets = true;
      addResult(
        results,
        context,
        "Security",
        "Exposed Secrets",
        false,
        true,
        `Found ${desc}: ${pattern}`,
        result.output.split("\n").slice(0, 3).join("\n"),
      );
    }
  }

  // Check for hardcoded passwords (look for actual string literals only)
  const passwordCheck = runCommand(
    `grep -rE "password\\s*=\\s*['\\\"](?!\\$\\{)(admin|test|password|123)['\\\"]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true`,
    true,
  );
  if (
    passwordCheck.output.trim() &&
    !passwordCheck.output.includes("Command failed") &&
    !passwordCheck.output.includes("searchParams") &&
    !passwordCheck.output.includes("process.env")
  ) {
    foundSecrets = true;
    addResult(
      results,
      context,
      "Security",
      "Hardcoded Passwords",
      false,
      true,
      "Found hardcoded passwords",
      passwordCheck.output.split("\n").slice(0, 3).join("\n"),
    );
  }

  if (!foundSecrets) {
    addResult(
      results,
      context,
      "Security",
      "Exposed Secrets",
      true,
      true,
      "No hardcoded secrets detected",
    );
  }

  // Check for dangerous patterns
  console.log("  Checking for dangerous code patterns...");
  const dangerousPatterns = [
    { pattern: "eval\\(", risk: "Code injection", critical: true },
    {
      pattern: "innerHTML\\s*=(?!.*json)",
      risk: "XSS vulnerability",
      critical: true,
    },
    {
      pattern: "\\.exec\\(.*\\$\\{",
      risk: "Command injection",
      critical: true,
    },
    {
      pattern: "child_process.*exec\\(.*\\+",
      risk: "Command injection",
      critical: true,
    },
  ];

  let foundDangerous = false;
  for (const { pattern, risk, critical } of dangerousPatterns) {
    const result = runCommand(
      `grep -rE '${pattern}' src/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null || true`,
      true,
    );
    if (result.output.trim() && !result.output.includes("Command failed")) {
      // Filter out safe uses (like JSON-LD in script tags)
      const lines = result.output.split("\n").filter((line) => {
        return (
          line.trim() &&
          !line.includes("JSON.stringify") &&
          !line.includes("jsonLd") &&
          !line.includes("application/ld+json")
        );
      });

      if (lines.length > 0) {
        foundDangerous = true;
        addResult(
          results,
          context,
          "Security",
          "Dangerous Patterns",
          false,
          critical,
          `Found ${risk}: ${pattern}`,
          lines.slice(0, 3).join("\n"),
        );
      }
    }
  }

  if (!foundDangerous) {
    addResult(
      results,
      context,
      "Security",
      "Dangerous Patterns",
      true,
      true,
      "No dangerous code patterns found",
    );
  }

  // Check npm audit for vulnerabilities
  console.log("  Running npm audit...");
  const auditResult = runCommand("npm audit --audit-level=high --json", true);

  try {
    const audit = JSON.parse(auditResult.output);
    const highVulns = audit.metadata?.vulnerabilities?.high || 0;
    const criticalVulns = audit.metadata?.vulnerabilities?.critical || 0;

    if (highVulns > 0 || criticalVulns > 0) {
      addResult(
        results,
        context,
        "Security",
        "Dependencies",
        false,
        true,
        `Found ${highVulns} high and ${criticalVulns} critical vulnerabilities`,
        "Run: npm audit fix",
      );
    } else {
      addResult(
        results,
        context,
        "Security",
        "Dependencies",
        true,
        true,
        "No high/critical vulnerabilities found",
      );
    }
  } catch (e) {
    addResult(
      results,
      context,
      "Security",
      "Dependencies",
      false,
      false,
      "Could not run npm audit",
      "npm audit command failed",
    );
  }

  // Check .env.example doesn't have real values
  if (fs.existsSync(".env.example")) {
    const envExample = fs.readFileSync(".env.example", "utf-8");
    const suspiciousPatterns = [
      /password.*=.*[a-zA-Z0-9]{8,}$/im,
      /secret.*=.*[a-zA-Z0-9]{32,}$/im,
      /AKIA[0-9A-Z]{16}/,
    ];

    let hasSuspicious = false;
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(envExample)) {
        hasSuspicious = true;
        break;
      }
    }

    if (hasSuspicious) {
      addResult(
        results,
        context,
        "Security",
        ".env.example",
        false,
        true,
        "Possible real secrets in .env.example",
        "Ensure .env.example only contains placeholder values",
      );
    } else {
      addResult(
        results,
        context,
        "Security",
        ".env.example",
        true,
        false,
        ".env.example looks safe",
      );
    }
  }
}
