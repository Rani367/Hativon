import { execSync } from "child_process";
import { ValidationResult } from "./types";

export function addResult(
  results: ValidationResult[],
  context: { totalChecks: number; passedChecks: number; criticalFailures: number },
  category: string,
  name: string,
  passed: boolean,
  critical: boolean,
  message: string,
  details?: string,
) {
  context.totalChecks++;
  if (passed) context.passedChecks++;
  if (!passed && critical) context.criticalFailures++;

  results.push({ category, name, passed, critical, message, details });
}

export function runCommand(
  command: string,
  silent: boolean = true,
): { success: boolean; output: string } {
  try {
    const output = execSync(command, {
      cwd: process.cwd(),
      stdio: silent ? "pipe" : "inherit",
      encoding: "utf-8",
      timeout: 60000,
    });
    return { success: true, output };
  } catch (error) {
    const errorOutput =
      error && typeof error === "object" && "stdout" in error
        ? String(error.stdout)
        : error instanceof Error
          ? error.message
          : "";
    return { success: false, output: errorOutput };
  }
}
