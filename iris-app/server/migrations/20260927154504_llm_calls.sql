CREATE TABLE IF NOT EXISTS llm_calls (
  id TEXT PRIMARY KEY,
  model TEXT,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  latency_ms INTEGER,
  error_message TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_llm_calls_created_at
  ON llm_calls(created_at);
