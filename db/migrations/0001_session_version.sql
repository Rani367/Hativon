-- Sessions carry this number. Raising it signs a user out everywhere, which a
-- JWT can't do on its own. Tokens from before this column count as version 0.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;
