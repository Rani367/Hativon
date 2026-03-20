/**
 * Migration: Add password reset tokens table
 * Created: 2026-03-20
 *
 * Creates a table for secure, one-time-use password reset tokens.
 * Tokens are stored as SHA-256 hashes with expiry timestamps.
 */

import { db } from "../client";
import type { Migration } from "./index";

const migration: Migration = {
  id: "20260320000000",
  name: "add_password_reset_tokens",

  async up() {
    await db.query`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await db.query`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash
      ON password_reset_tokens(token_hash)
    `;

    await db.query`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user
      ON password_reset_tokens(user_id)
    `;

    console.log("[MIGRATION] Created password_reset_tokens table");
  },

  async down() {
    await db.query`
      DROP TABLE IF EXISTS password_reset_tokens
    `;

    console.log("[MIGRATION] Dropped password_reset_tokens table");
  },
};

export default migration;
