CREATE TABLE IF NOT EXISTS meta_app_credentials (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL,
  app_secret_vault TEXT NOT NULL,
  verify_token_vault TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
