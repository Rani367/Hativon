/**
 * Migration: Add AI image detection fields
 * Created: 2026-05-26
 *
 * Stores the result of scanning a post's cover image with an AI-image detector.
 * `is_ai_generated` drives both the public-feed ordering (AI posts sink to the
 * bottom) and the post-card badge. It is NOT NULL so un-scanned posts sort with
 * normal posts instead of NULLS LAST.
 */

import { db } from "../client";
import { writeStdoutLine } from "@/lib/server-log";
import type { Migration } from "./index";

const migration: Migration = {
  id: "20260526000000",
  name: "add_ai_image_detection",

  async up() {
    await db.query`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE
    `;

    await db.query`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS ai_detection_score REAL
    `;

    await db.query`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS ai_detected_at TIMESTAMP
    `;

    writeStdoutLine("[MIGRATION] Added AI image detection columns");
  },

  async down() {
    await db.query`
      ALTER TABLE posts
      DROP COLUMN IF EXISTS ai_detected_at
    `;

    await db.query`
      ALTER TABLE posts
      DROP COLUMN IF EXISTS ai_detection_score
    `;

    await db.query`
      ALTER TABLE posts
      DROP COLUMN IF EXISTS is_ai_generated
    `;

    writeStdoutLine("[MIGRATION] Removed AI image detection columns");
  },
};

export default migration;
