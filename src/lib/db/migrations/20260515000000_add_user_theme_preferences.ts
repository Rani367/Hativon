/**
 * Migration: Add user theme preferences
 * Created: 2026-05-15
 *
 * Stores synced dark-mode preference and one-time announcement dismissal state.
 */

import { db } from "../client";
import { writeStdoutLine } from "@/lib/server-log";
import type { Migration } from "./index";

const migration: Migration = {
  id: "20260515000000",
  name: "add_user_theme_preferences",

  async up() {
    await db.query`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10) NOT NULL DEFAULT 'light'
    `;

    await db.query`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_theme_preference_check
    `;

    await db.query`
      ALTER TABLE users
      ADD CONSTRAINT users_theme_preference_check
      CHECK (theme_preference IN ('light', 'dark'))
    `;

    await db.query`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS dark_mode_announcement_dismissed BOOLEAN NOT NULL DEFAULT FALSE
    `;

    writeStdoutLine("[MIGRATION] Added user theme preference columns");
  },

  async down() {
    await db.query`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_theme_preference_check
    `;

    await db.query`
      ALTER TABLE users
      DROP COLUMN IF EXISTS dark_mode_announcement_dismissed
    `;

    await db.query`
      ALTER TABLE users
      DROP COLUMN IF EXISTS theme_preference
    `;

    writeStdoutLine("[MIGRATION] Removed user theme preference columns");
  },
};

export default migration;
