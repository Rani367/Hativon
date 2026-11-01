-- posts.date decides which issue a post belongs to. It used to be set when a
-- draft was created, so a draft started in March and published in May landed in
-- March. The first publish now moves it to the publish date, and this column
-- records that it happened so later edits and republishes leave the issue alone.
--
-- Left NULL for existing posts on purpose: they keep their current issue, and a
-- backfill would fire the updated_at trigger and look like an edit to every post.
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS first_published_at TIMESTAMP;
