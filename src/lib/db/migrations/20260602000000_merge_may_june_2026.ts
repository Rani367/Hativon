/**
 * Migration: Merge May 2026 + June 2026 into one combined "double issue"
 * Created: 2026-06-02
 *
 * May 2026 has only 7 posts, so it is merged with June 2026 into a single
 * gilayon titled "גיליון מאי–יוני 2026". No posts are moved — the merge is
 * stored as config in the `settings` table (key `merged_issues`) and resolved
 * at query/render time (see lib/issues/merged-issues.ts). As June posts are
 * published they join the same combined issue automatically (the range query
 * spans both months).
 *
 * Purely additive: the homepage default month is intentionally left untouched,
 * so this migration changes nothing until the merge-aware code is deployed.
 * Reversible: down() removes the merge config, splitting the two months apart.
 */

import { db } from "../client";
import { writeStdoutLine } from "@/lib/server-log";
import type { Migration } from "./index";

const MERGED_ISSUES = [
  {
    startYear: 2026,
    startMonth: 5,
    endYear: 2026,
    endMonth: 6,
    canonicalYear: 2026,
    canonicalMonth: 6,
    label: "מאי–יוני",
  },
];

const migration: Migration = {
  id: "20260602000000",
  name: "merge_may_june_2026",

  async up() {
    // The settings table is created by an earlier migration; guard anyway so
    // this migration is safe to run on a fresh database.
    await db.query`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const value = JSON.stringify(MERGED_ISSUES);
    await db.query`
      INSERT INTO settings (key, value, updated_at)
      VALUES ('merged_issues', ${value}, CURRENT_TIMESTAMP)
      ON CONFLICT (key)
      DO UPDATE SET value = ${value}, updated_at = CURRENT_TIMESTAMP
    `;

    writeStdoutLine("[MIGRATION] Merged May+June 2026 into one combined issue");
  },

  async down() {
    await db.query`
      DELETE FROM settings WHERE key = 'merged_issues'
    `;

    writeStdoutLine("[MIGRATION] Removed May+June 2026 merge config");
  },
};

export default migration;
