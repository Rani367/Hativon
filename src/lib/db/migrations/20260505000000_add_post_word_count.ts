/**
 * Migration: Add post word count
 * Created: 2026-05-05
 *
 * Stores precomputed word counts so public post grids do not need full content.
 */

import { db } from "../client";
import { writeStdoutLine } from "@/lib/server-log";
import type { Migration } from "./index";

const migration: Migration = {
  id: "20260505000000",
  name: "add_post_word_count",

  async up() {
    await db.query`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS word_count INTEGER NOT NULL DEFAULT 0
    `;

    await db.query`
      UPDATE posts
      SET word_count = COALESCE(
        array_length(
          regexp_split_to_array(
            trim(regexp_replace(content, '\\s+', ' ', 'g')),
            '\\s+'
          ),
          1
        ),
        0
      )
      WHERE content IS NOT NULL
        AND trim(content) != ''
        AND word_count = 0
    `;

    writeStdoutLine("[MIGRATION] Added post word count column");
  },

  async down() {
    await db.query`
      ALTER TABLE posts
      DROP COLUMN IF EXISTS word_count
    `;

    writeStdoutLine("[MIGRATION] Removed post word count column");
  },
};

export default migration;
