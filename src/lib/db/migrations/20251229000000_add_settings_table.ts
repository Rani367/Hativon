/**
 * Migration: Add settings table
 * Created: 2025-12-29
 *
 * Creates a key-value settings table for site-wide configuration:
 * - default_month: The month to display on the homepage
 * - default_year: The year to display on the homepage
 */

import { db } from "../client";
import type { Migration } from "./index";

const migration: Migration = {
  id: "20251229000000",
  name: "add_settings_table",

  async up() {
    // Create settings table
    await db.query`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add trigger for auto-updating updated_at
    await db.query`
      DROP TRIGGER IF EXISTS update_settings_updated_at ON settings
    `;
    await db.query`
      CREATE TRIGGER update_settings_updated_at
        BEFORE UPDATE ON settings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    // Get current month/year for initial default
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const monthNames = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    const currentMonth = monthNames[now.getMonth()];

    // Insert default settings (use ON CONFLICT to avoid duplicates)
    await db.query`
      INSERT INTO settings (key, value) VALUES ('default_month', ${currentMonth})
      ON CONFLICT (key) DO NOTHING
    `;

    await db.query`
      INSERT INTO settings (key, value) VALUES ('default_year', ${currentYear})
      ON CONFLICT (key) DO NOTHING
    `;

    console.log("[MIGRATION] Created settings table with default month/year");
  },

  async down() {
    // Drop trigger first
    await db.query`
      DROP TRIGGER IF EXISTS update_settings_updated_at ON settings
    `;

    // Drop table
    await db.query`
      DROP TABLE IF EXISTS settings
    `;

    console.log("[MIGRATION] Removed settings table");
  },
};

export default migration;
