export interface ValidationResult {
  category: string;
  name: string;
  passed: boolean;
  critical: boolean;
  message: string;
  details?: string;
}

export interface ValidationContext {
  results: ValidationResult[];
  totalChecks: number;
  passedChecks: number;
  criticalFailures: number;
}

export const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};
