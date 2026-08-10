-- flow_id agrupa uma execução completa do harness; steps com telemetria LLM por estágio.
ALTER TABLE agent_runs ADD COLUMN flow_id TEXT;
UPDATE agent_runs SET flow_id = id WHERE flow_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_agent_runs_flow_id ON agent_runs(flow_id);

PRAGMA foreign_keys = OFF;

CREATE TABLE agent_run_steps_new (
  id TEXT PRIMARY KEY,
  agent_run_id TEXT NOT NULL REFERENCES agent_runs(id),
  comment_id TEXT REFERENCES comments(id),
  stage TEXT NOT NULL,
  verdict TEXT NOT NULL,
  reason TEXT,
  reasoning TEXT,
  output_json TEXT,
  model TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  latency_ms INTEGER,
  created_at TEXT NOT NULL
);

INSERT INTO agent_run_steps_new (
  id,
  agent_run_id,
  comment_id,
  stage,
  verdict,
  reason,
  reasoning,
  output_json,
  created_at
)
SELECT
  id,
  agent_run_id,
  comment_id,
  stage,
  verdict,
  reason,
  reasoning,
  output_json,
  created_at
FROM agent_run_steps;

DROP TABLE agent_run_steps;

ALTER TABLE agent_run_steps_new RENAME TO agent_run_steps;

CREATE INDEX IF NOT EXISTS idx_agent_run_steps_comment_created
  ON agent_run_steps(comment_id, created_at);

CREATE INDEX IF NOT EXISTS idx_agent_run_steps_run_created
  ON agent_run_steps(agent_run_id, created_at);

PRAGMA foreign_keys = ON;
