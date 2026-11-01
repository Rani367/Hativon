-- One counter per post and nothing about who read it. This is a separate table
-- so counting a read doesn't rewrite a wide posts row, and doesn't fire the
-- updated_at trigger, which would look like an edit and raise false conflicts in
-- the editor.
CREATE TABLE IF NOT EXISTS post_reads (
  post_id TEXT PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  read_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
