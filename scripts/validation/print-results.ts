import { ValidationResult, ValidationContext, colors } from "./types";

export function printResults(
  results: ValidationResult[],
  context: ValidationContext,
): boolean {
  console.log(`\n${"=".repeat(80)}`);
  console.log(
    `${colors.bold}${colors.cyan}COMPREHENSIVE VALIDATION RESULTS${colors.reset}`,
  );
  console.log(`${"=".repeat(80)}\n`);

  // Group by category
  const categories = Array.from(new Set(results.map((r) => r.category)));

  for (const category of categories) {
    console.log(`${colors.bold}${category}${colors.reset}`);
    console.log("─".repeat(80));

    const categoryResults = results.filter((r) => r.category === category);

    for (const result of categoryResults) {
      const icon = result.passed
        ? `${colors.green}[OK]${colors.reset}`
        : `${colors.red}[FAIL]${colors.reset}`;
      const critical = result.critical
        ? ` ${colors.red}[CRITICAL]${colors.reset}`
        : "";

      console.log(`${icon} ${result.name}${critical}`);
      console.log(`    ${result.message}`);

      if (result.details) {
        const detailLines = result.details.split("\n").slice(0, 5);
        detailLines.forEach((line) => {
          if (line.trim()) {
            console.log(`    ${colors.yellow}│${colors.reset} ${line}`);
          }
        });
        if (result.details.split("\n").length > 5) {
          console.log(`    ${colors.yellow}│${colors.reset} ... (truncated)`);
        }
      }
      console.log();
    }
  }

  console.log(`${"=".repeat(80)}`);
  console.log(`${colors.bold}SUMMARY${colors.reset}`);
  console.log(`${"=".repeat(80)}`);
  console.log(`Total Checks: ${context.totalChecks}`);
  console.log(`${colors.green}Passed: ${context.passedChecks}${colors.reset}`);
  console.log(
    `${colors.red}Failed: ${context.totalChecks - context.passedChecks}${colors.reset}`,
  );
  console.log(
    `${colors.red}${colors.bold}Critical Failures: ${context.criticalFailures}${colors.reset}`,
  );
  console.log(`${"=".repeat(80)}\n`);

  // Collect all failures and warnings
  const failures = results.filter((r) => !r.passed);
  const criticalFailures = failures.filter((r) => r.critical);
  const warnings = failures.filter((r) => !r.critical);

  // Print detailed error/warning summary at the bottom for easy copying
  if (failures.length > 0) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(
      `${colors.bold}${colors.red}ERRORS AND WARNINGS SUMMARY${colors.reset}`,
    );
    console.log(
      `${colors.dim}(Scroll up for full details, or copy this section)${colors.reset}`,
    );
    console.log(`${"=".repeat(80)}\n`);

    if (criticalFailures.length > 0) {
      console.log(
        `${colors.bold}${colors.red}CRITICAL ERRORS (${criticalFailures.length}):${colors.reset}`,
      );
      console.log(`${"─".repeat(80)}\n`);

      criticalFailures.forEach((result, index) => {
        console.log(
          `${colors.red}${index + 1}. [${result.category}] ${result.name}${colors.reset}`,
        );
        console.log(`   ${result.message}`);
        if (result.details) {
          console.log(`\n   Details:`);
          const detailLines = result.details.split("\n");
          detailLines.forEach((line) => {
            if (line.trim()) {
              console.log(`   ${line}`);
            }
          });
        }
        console.log();
      });
    }

    if (warnings.length > 0) {
      console.log(
        `${colors.bold}${colors.yellow}WARNINGS (${warnings.length}):${colors.reset}`,
      );
      console.log(`${"─".repeat(80)}\n`);

      warnings.forEach((result, index) => {
        console.log(
          `${colors.yellow}${index + 1}. [${result.category}] ${result.name}${colors.reset}`,
        );
        console.log(`   ${result.message}`);
        if (result.details) {
          console.log(`\n   Details:`);
          const detailLines = result.details.split("\n");
          detailLines.forEach((line) => {
            if (line.trim()) {
              console.log(`   ${line}`);
            }
          });
        }
        console.log();
      });
    }

    console.log(`${"=".repeat(80)}\n`);
  }

  if (context.criticalFailures > 0) {
    console.log(
      `${colors.red}${colors.bold}[ERROR] ${context.criticalFailures} CRITICAL FAILURE(S) DETECTED${colors.reset}`,
    );
    console.log(
      `${colors.red}Cannot proceed with deployment. Fix critical issues above.${colors.reset}\n`,
    );
    return false;
  } else if (context.totalChecks - context.passedChecks > 0) {
    console.log(
      `${colors.yellow}[WARNING] ${context.totalChecks - context.passedChecks} non-critical issues found${colors.reset}`,
    );
    console.log(
      `${colors.yellow}Consider fixing before deployment, but build can proceed.${colors.reset}\n`,
    );
    return true;
  } else {
    console.log(
      `${colors.green}${colors.bold}[OK] ALL CHECKS PASSED!${colors.reset}`,
    );
    console.log(
      `${colors.green}Your code is ready for production deployment.${colors.reset}\n`,
    );
    return true;
  }
}
