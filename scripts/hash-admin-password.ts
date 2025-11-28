#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import bcrypt from "bcrypt";
import readline from "readline";

const ENV_FILE = resolve(process.cwd(), ".env.local");

/**
 * Prompt user for input via readline
 */
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Hash admin password and update .env.local
 */
async function hashAdminPassword() {
  console.log("[SETUP] Admin Password Hashing Utility\n");

  // Check if .env.local exists
  let envContent = "";
  try {
    envContent = readFileSync(ENV_FILE, "utf-8");
  } catch (error) {
    console.error("[ERROR] .env.local not found. Please create it first.");
    process.exit(1);
  }

  // Extract current admin password
  const match = envContent.match(/^ADMIN_PASSWORD=(.*)$/m);
  if (!match) {
    console.error("[ERROR] ADMIN_PASSWORD not found in .env.local");
    process.exit(1);
  }

  const currentPassword = match[1];

  // Check if already hashed
  if (/^\$2[aby]\$/.test(currentPassword)) {
    console.log("[INFO] Admin password is already hashed.");
    const shouldRehash = await prompt(
      "Do you want to set a new password? (y/n): ",
    );
    if (shouldRehash.toLowerCase() !== "y") {
      console.log("[OK] No changes made.");
      process.exit(0);
    }
  } else {
    console.log("[WARNING] Admin password is currently stored in plain text.");
    console.log(`Current plain text password: ${currentPassword}\n`);
  }

  // Get new password
  const newPassword = await prompt("Enter new admin password (min 8 chars): ");

  if (!newPassword || newPassword.length < 8) {
    console.error("[ERROR] Password must be at least 8 characters long.");
    process.exit(1);
  }

  const confirmPassword = await prompt("Confirm admin password: ");

  if (newPassword !== confirmPassword) {
    console.error("[ERROR] Passwords do not match.");
    process.exit(1);
  }

  // Hash password
  console.log("\n[SETUP] Hashing password...");
  const hash = await bcrypt.hash(newPassword, 10);

  // Update .env.local
  const newEnvContent = envContent.replace(
    /^ADMIN_PASSWORD=.*$/m,
    `ADMIN_PASSWORD=${hash}`,
  );

  writeFileSync(ENV_FILE, newEnvContent, "utf-8");

  console.log("[OK] Admin password hashed successfully!");
  console.log("[INFO] Your .env.local has been updated.");
  console.log("[INFO] The password hash has been saved securely.");
  console.log(
    "\n[IMPORTANT] Remember your new password - you will need it to access /admin",
  );
  console.log(
    "[IMPORTANT] The hash cannot be reversed to recover the password.",
  );
}

hashAdminPassword().catch((error) => {
  console.error("[ERROR] Failed to hash admin password:", error);
  process.exit(1);
});
