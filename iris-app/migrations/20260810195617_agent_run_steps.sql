CREATE TABLE IF NOT EXISTS agent_run_steps (
  id TEXT PRIMARY KEY,
  agent_run_id TEXT NOT NULL REFERENCES agent_runs(id),
  comment_id TEXT NOT NULL REFERENCES comments(id),
  stage TEXT NOT NULL,
  verdict TEXT NOT NULL,
  reason TEXT,
  reasoning TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_run_steps_comment_created
  ON agent_run_steps(comment_id, created_at);
