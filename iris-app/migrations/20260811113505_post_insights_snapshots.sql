CREATE TABLE IF NOT EXISTS post_insights_snapshots (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id),
  ig_media_id TEXT NOT NULL,
  metrics_json TEXT NOT NULL,
  media_json TEXT,
  fetched_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_insights_snapshots_post_fetched
  ON post_insights_snapshots(post_id, fetched_at DESC);
