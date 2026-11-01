-- Set when a teacher unpublishes a post. Publishing is otherwise instant, so
-- without this a writer could put the post straight back. Only a teacher can
-- clear it.
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS teacher_hold BOOLEAN NOT NULL DEFAULT FALSE;
