/**
 * Migration: Add AI image fields
 * Created: 2026-06-03
 *
 * Adds a per-post flag marking whether the cover image was AI-generated, and a
 * per-user flag tracking whether the one-time AI-image backfill survey has been
 * completed.
 */

import { db } from "../client";
import { writeStdoutLine } from "@/lib/server-log";
import type { Migration } from "./index";

const migration: Migration = {
  id: "20260603000000",
  name: "add_ai_image_fields",

  async up() {
    await db.query`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS ai_generated_image BOOLEAN NOT NULL DEFAULT FALSE
    `;

    await db.query`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS ai_image_survey_dismissed BOOLEAN NOT NULL DEFAULT FALSE
    `;

    writeStdoutLine("[MIGRATION] Added AI image fields");
  },

  async down() {
    await db.query`
      ALTER TABLE users
      DROP COLUMN IF EXISTS ai_image_survey_dismissed
    `;

    await db.query`
      ALTER TABLE posts
      DROP COLUMN IF EXISTS ai_generated_image
    `;

    writeStdoutLine("[MIGRATION] Removed AI image fields");
  },
};

export default migration;
