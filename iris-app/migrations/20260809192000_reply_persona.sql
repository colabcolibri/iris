CREATE TABLE IF NOT EXISTS reply_persona (
  id TEXT PRIMARY KEY,
  system_prompt TEXT NOT NULL,
  tone TEXT NOT NULL,
  brand_name TEXT,
  max_chars INTEGER NOT NULL DEFAULT 500,
  updated_at TEXT NOT NULL
);
