CREATE TABLE IF NOT EXISTS operator_notification_settings (
  id TEXT PRIMARY KEY NOT NULL DEFAULT 'primary',
  channels_json TEXT NOT NULL DEFAULT '{"email":{"enabled":false,"destination":""}}',
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO operator_notification_settings (id, channels_json, updated_at)
VALUES ('primary', '{"email":{"enabled":false,"destination":""}}', datetime('now'));

CREATE TABLE IF NOT EXISTS operator_notifications (
  id TEXT PRIMARY KEY NOT NULL,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_summary TEXT NOT NULL,
  recipient TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_operator_notifications_created_at
  ON operator_notifications (created_at DESC);
