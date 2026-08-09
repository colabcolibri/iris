-- Iris initial schema (v1)
-- See docs/06_database.md

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  channel TEXT NOT NULL,
  caption TEXT,
  scheduled_at TEXT,
  published_at TEXT,
  ig_media_id TEXT,
  source_note TEXT,
  error_message TEXT,
  auto_reply_enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS post_assets (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id),
  sort_order INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  mime TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  original_size_bytes INTEGER,
  optimized_size_bytes INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  ig_comment_id TEXT NOT NULL UNIQUE,
  post_id TEXT NOT NULL REFERENCES posts(id),
  author_username TEXT,
  text TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  trigger TEXT NOT NULL,
  input_summary TEXT,
  output_summary TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comment_replies (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL REFERENCES comments(id),
  draft_text TEXT,
  sent_text TEXT,
  status TEXT NOT NULL,
  agent_run_id TEXT REFERENCES agent_runs(id)
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  label TEXT,
  key_hash TEXT NOT NULL,
  scopes TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS meta_tokens (
  id TEXT PRIMARY KEY,
  token_vault TEXT NOT NULL,
  expires_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_status_scheduled_at ON posts(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_post_assets_post_id_sort_order ON post_assets(post_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_ig_comment_id ON comments(ig_comment_id);
