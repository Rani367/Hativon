/**
 * Migration: Add password reset request support
 * Created: 2026-02-26
 *
 * Adds password_reset_requested column to users table
 * so users can flag that they need a password reset,
 * and admins can see and act on these requests.
 */

import { db } from "../client";
import type { Migration } from "./index";

const migration: Migration = {
  id: "20260226000000",
  name: "add_password_reset",

  async up() {
    await db.query`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_reset_requested BOOLEAN DEFAULT FALSE
    `;

    console.log("[MIGRATION] Added password_reset_requested column to users");
  },

  async down() {
    await db.query`
      ALTER TABLE users
      DROP COLUMN IF EXISTS password_reset_requested
    `;

    console.log("[MIGRATION] Removed password_reset_requested column from users");
  },
};

export default migration;
