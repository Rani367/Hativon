#!/usr/bin/env tsx

/**
 * Post-Build Commit Script
 *
 * After successful build validation, prompts user to commit changes locally.
 * This ensures only validated, working code gets committed.
 * User must manually run 'git push' to deploy to GitHub/Vercel.
 *
 * Usage:
 *   Automatically called after successful pnpm run pre-deploy
 *   tsx scripts/post-build-deploy.ts
 *
 * Options:
 *   --no-commit, -n    Skip the commit step (useful for CI or Claude validation)
 */

import { execSync } from "child_process";
import * as readline from "readline";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

/**
 * Check if git is initialized
 */
function isGitRepository(): boolean {
  try {
    execSync("git rev-parse --git-dir", {
      stdio: "pipe",
      cwd: process.cwd(),
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if there are uncommitted changes
 */
function hasUncommittedChanges(): boolean {
  try {
    const status = execSync("git status --porcelain", {
      stdio: "pipe",
      encoding: "utf-8",
      cwd: process.cwd(),
    });
    return status.trim().length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get current branch name
 */
function getCurrentBranch(): string {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      stdio: "pipe",
      encoding: "utf-8",
      cwd: process.cwd(),
    });
    return branch.trim();
  } catch (error) {
    return "unknown";
  }
}

/**
 * Get git status summary
 */
function getGitStatus(): { modified: number; added: number; deleted: number } {
  try {
    const status = execSync("git status --porcelain", {
      stdio: "pipe",
      encoding: "utf-8",
      cwd: process.cwd(),
    });

    const lines = status
      .trim()
      .split("\n")
      .filter((line) => line.length > 0);

    let modified = 0;
    let added = 0;
    let deleted = 0;

    lines.forEach((line) => {
      const statusCode = line.substring(0, 2).trim();
      if (statusCode.includes("M")) modified++;
      if (statusCode.includes("A") || statusCode === "??") added++;
      if (statusCode.includes("D")) deleted++;
    });

    return { modified, added, deleted };
  } catch (error) {
    return { modified: 0, added: 0, deleted: 0 };
  }
}

/**
 * Stage all changes
 */
function stageChanges(): void {
  execSync("git add .", {
    stdio: "inherit",
    cwd: process.cwd(),
  });
}

/**
 * Commit changes
 */
function commitChanges(message: string): void {
  // Escape single quotes in the message
  const escapedMessage = message.replace(/'/g, "'\\''");

  execSync(`git commit -m '${escapedMessage}'`, {
    stdio: "inherit",
    cwd: process.cwd(),
  });
}

/**
 * Push changes to remote
 */
function pushChanges(): void {
  execSync("git push", {
    stdio: "inherit",
    cwd: process.cwd(),
  });
}

/**
 * Check for --no-commit or -n flag
 */
function shouldSkipCommit(): boolean {
  const args = process.argv.slice(2);
  return args.includes("--no-commit") || args.includes("-n");
}

/**
 * Main function
 */
async function main() {
  // Check for --no-commit flag
  if (shouldSkipCommit()) {
    console.log(
      `\n${colors.green}${colors.bold}[OK] Validation passed! Skipping commit (--no-commit flag).${colors.reset}\n`,
    );
    rl.close();
    process.exit(0);
  }

  // Skip git deployment in CI/CD environments (Vercel, GitHub Actions, etc.)
  if (process.env.CI || process.env.VERCEL || process.env.GITHUB_ACTIONS) {
    console.log(
      `\n${colors.cyan}Running in CI/CD environment. Skipping git deployment.${colors.reset}\n`,
    );
    rl.close();
    process.exit(0);
  }

  console.log(
    `\n${colors.cyan}${colors.bold}=== Git Deployment ===${colors.reset}\n`,
  );

  // Check if git is initialized
  if (!isGitRepository()) {
    console.log(
      `${colors.yellow} Not a git repository. Skipping deployment.${colors.reset}\n`,
    );
    rl.close();
    process.exit(0);
  }

  // Check if there are uncommitted changes
  if (!hasUncommittedChanges()) {
    console.log(
      `${colors.green}[OK] No uncommitted changes. Nothing to deploy.${colors.reset}\n`,
    );
    rl.close();
    process.exit(0);
  }

  // Get current branch and status
  const branch = getCurrentBranch();
  const status = getGitStatus();

  console.log(`${colors.cyan}Current branch:${colors.reset} ${branch}`);
  console.log(`${colors.cyan}Changes:${colors.reset}`);
  if (status.modified > 0)
    console.log(
      `  ${colors.yellow}Modified:${colors.reset} ${status.modified} file(s)`,
    );
  if (status.added > 0)
    console.log(
      `  ${colors.green}Added:${colors.reset} ${status.added} file(s)`,
    );
  if (status.deleted > 0)
    console.log(
      `  ${colors.red}Deleted:${colors.reset} ${status.deleted} file(s)`,
    );
  console.log();

  // Show git status
  console.log(`${colors.cyan}Git status:${colors.reset}`);
  try {
    execSync("git status --short", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
  } catch (error) {
    // Ignore errors
  }
  console.log();

  // Ask for confirmation
  const confirm = await question(
    `${colors.bold}Do you want to commit these changes? (y/n): ${colors.reset}`,
  );

  if (confirm.toLowerCase() !== "y" && confirm.toLowerCase() !== "yes") {
    console.log(`\n${colors.yellow}Deployment cancelled.${colors.reset}\n`);
    rl.close();
    process.exit(0);
  }

  // Ask for commit message
  console.log(`\n${colors.cyan}Enter commit message:${colors.reset}`);
  const commitMessage = await question("> ");

  if (!commitMessage || commitMessage.trim().length === 0) {
    console.log(
      `\n${colors.red} Commit message cannot be empty.${colors.reset}\n`,
    );
    rl.close();
    process.exit(1);
  }

  console.log();

  try {
    // Stage changes
    console.log(`${colors.cyan}Staging changes...${colors.reset}`);
    stageChanges();
    console.log(`${colors.green}[OK] Changes staged${colors.reset}\n`);

    // Commit changes
    console.log(`${colors.cyan}Committing changes...${colors.reset}`);
    commitChanges(commitMessage.trim());
    console.log(`${colors.green}[OK] Changes committed${colors.reset}\n`);

    console.log(
      `${colors.green}${colors.bold}[OK] Commit successful!${colors.reset}`,
    );
    console.log(
      `${colors.cyan}Your changes have been committed locally.${colors.reset}`,
    );
    console.log(
      `${colors.cyan}To push to GitHub, run: ${colors.bold}git push${colors.reset}\n`,
    );
  } catch (error) {
    console.error(
      `\n${colors.red}${colors.bold} Commit failed${colors.reset}`,
    );
    console.error(
      `${colors.red}${error instanceof Error ? error.message : String(error)}${colors.reset}\n`,
    );
    rl.close();
    process.exit(1);
  }

  rl.close();
  process.exit(0);
}

main().catch((error) => {
  console.error(`\n${colors.red}Unexpected error:${colors.reset}`, error);
  rl.close();
  process.exit(1);
});
