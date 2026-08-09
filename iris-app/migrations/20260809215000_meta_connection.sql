-- Meta Instagram connection metadata (v1 single account)
CREATE TABLE IF NOT EXISTS meta_connection (
  id TEXT PRIMARY KEY,
  ig_user_id TEXT NOT NULL,
  ig_username TEXT,
  page_id TEXT NOT NULL,
  page_name TEXT,
  connected_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
