#!/usr/bin/env tsx

// validates env vars before deploy

import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

interface Issue {
  variable: string;
  message: string;
  isError: boolean;
  hint?: string;
}

const issues: Issue[] = [];

function err(variable: string, message: string, hint?: string) {
  issues.push({ variable, message, isError: true, hint });
}

function warn(variable: string, message: string, hint?: string) {
  issues.push({ variable, message, isError: false, hint });
}

function isVercel(): boolean {
  return process.env.VERCEL === "1";
}

// --- validations ---

// admin password
const adminPw = process.env.ADMIN_PASSWORD;
if (!adminPw?.trim()) {
  err("ADMIN_PASSWORD", "Required", "Set a password for admin panel");
} else {
  if (adminPw.length < 8) {
    warn("ADMIN_PASSWORD", "Pretty short (< 8 chars)");
  }
  if (
    ["admin", "password", "12345678", "admin123"].includes(
      adminPw.toLowerCase(),
    )
  ) {
    warn("ADMIN_PASSWORD", "Weak password");
  }
}

// jwt secret
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret?.trim()) {
  err("JWT_SECRET", "Required", "Generate with: openssl rand -base64 32");
} else {
  if (jwtSecret.length < 32) {
    err("JWT_SECRET", "Too short (need 32+ chars)", "openssl rand -base64 32");
  }
  if (["your_jwt_secret_here", "secret", "123456"].includes(jwtSecret)) {
    err("JWT_SECRET", "Placeholder value detected");
  }
}

// site url
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!siteUrl?.trim()) {
  err("NEXT_PUBLIC_SITE_URL", "Required");
} else {
  try {
    const parsed = new URL(siteUrl);
    if (isVercel() && parsed.protocol === "http:") {
      warn("NEXT_PUBLIC_SITE_URL", "Using HTTP in prod");
    }
    if (isVercel() && parsed.hostname === "localhost") {
      err("NEXT_PUBLIC_SITE_URL", "Localhost in prod");
    }
    if (siteUrl.endsWith("/")) {
      warn("NEXT_PUBLIC_SITE_URL", "Has trailing slash");
    }
  } catch {
    err("NEXT_PUBLIC_SITE_URL", "Invalid URL");
  }
}

// session duration (optional)
const sessionDur = process.env.SESSION_DURATION;
if (sessionDur?.trim()) {
  const parsed = parseInt(sessionDur, 10);
  if (isNaN(parsed)) {
    err("SESSION_DURATION", "Not a number");
  } else if (parsed < 3600) {
    warn("SESSION_DURATION", "Very short (< 1 hour)");
  } else if (parsed > 2592000) {
    warn("SESSION_DURATION", "Very long (> 30 days)");
  }
}

// postgres (optional)
const pgUrl = process.env.POSTGRES_URL;
if (!pgUrl?.trim()) {
  warn("POSTGRES_URL", "Not set (admin-only mode)");
} else if (
  !pgUrl.startsWith("postgres://") &&
  !pgUrl.startsWith("postgresql://")
) {
  err("POSTGRES_URL", "Invalid connection string");
}

// blob token
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
if (isVercel() && !blobToken?.trim()) {
  warn("BLOB_READ_WRITE_TOKEN", "Not configured (local storage fallback)");
}

// check .env.local exists
if (!fs.existsSync(envPath) && !isVercel()) {
  warn(".env.local", "File not found", "Copy from .env.example");
}

// --- output ---

console.log(`\n${colors.cyan}=== Environment Validation ===${colors.reset}\n`);

const errors = issues.filter((i) => i.isError);
const warnings = issues.filter((i) => !i.isError);

if (issues.length === 0) {
  console.log(`${colors.green}[OK] All good${colors.reset}\n`);
  process.exit(0);
}

if (errors.length > 0) {
  console.log(`${colors.red}Errors:${colors.reset}`);
  errors.forEach((e, i) => {
    console.log(`  ${i + 1}. ${e.variable}: ${e.message}`);
    if (e.hint)
      console.log(`     ${colors.cyan}hint: ${e.hint}${colors.reset}`);
  });
  console.log();
}

if (warnings.length > 0) {
  console.log(`${colors.yellow}Warnings:${colors.reset}`);
  warnings.forEach((w, i) => {
    console.log(`  ${i + 1}. ${w.variable}: ${w.message}`);
    if (w.hint)
      console.log(`     ${colors.cyan}hint: ${w.hint}${colors.reset}`);
  });
  console.log();
}

if (errors.length > 0) {
  console.log(
    `${colors.red}Failed with ${errors.length} error(s)${colors.reset}\n`,
  );
  process.exit(1);
} else {
  console.log(
    `${colors.yellow}Passed with ${warnings.length} warning(s)${colors.reset}\n`,
  );
}
