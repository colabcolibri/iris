ALTER TABLE comments ADD COLUMN parent_ig_comment_id TEXT;

CREATE INDEX IF NOT EXISTS idx_comments_parent_ig_comment_id
  ON comments(parent_ig_comment_id);
