CREATE TABLE IF NOT EXISTS admin_login_challenges (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_request_at TEXT NOT NULL
);
