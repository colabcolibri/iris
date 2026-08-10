CREATE TABLE IF NOT EXISTS meta_webhook_events (
  id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL,
  signature_valid INTEGER NOT NULL DEFAULT 1,
  object TEXT,
  field TEXT,
  payload_json TEXT NOT NULL,
  processing_status TEXT NOT NULL,
  comment_id TEXT REFERENCES comments(id),
  post_id TEXT REFERENCES posts(id),
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_meta_webhook_events_received_at
  ON meta_webhook_events(received_at DESC);
