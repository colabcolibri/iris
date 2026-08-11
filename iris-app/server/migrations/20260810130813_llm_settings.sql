CREATE TABLE IF NOT EXISTS llm_settings (
  id TEXT PRIMARY KEY,
  api_key_vault TEXT,
  api_url TEXT NOT NULL,
  model TEXT NOT NULL,
  supports_vision INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
