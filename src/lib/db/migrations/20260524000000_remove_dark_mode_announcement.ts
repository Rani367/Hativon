/**
 * Migration: Remove dark mode announcement dismissal column
 * Created: 2026-05-24
 *
 * The one-time dark mode announcement Dialog has been removed, so the column
 * tracking its dismissal is no longer needed.
 */

import { db } from "../client";
import { writeStdoutLine } from "@/lib/server-log";
import type { Migration } from "./index";

const migration: Migration = {
  id: "20260524000000",
  name: "remove_dark_mode_announcement",

  async up() {
    await db.query`
      ALTER TABLE users
      DROP COLUMN IF EXISTS dark_mode_announcement_dismissed
    `;

    writeStdoutLine("[MIGRATION] Removed dark_mode_announcement_dismissed column");
  },

  async down() {
    await db.query`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS dark_mode_announcement_dismissed BOOLEAN NOT NULL DEFAULT FALSE
    `;

    writeStdoutLine("[MIGRATION] Restored dark_mode_announcement_dismissed column");
  },
};

export default migration;
