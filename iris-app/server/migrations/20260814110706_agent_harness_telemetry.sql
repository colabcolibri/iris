-- Harness agentic v1.23: tool steps, turn index e rollup de sessão.

ALTER TABLE agent_runs ADD COLUMN started_at TEXT;
ALTER TABLE agent_runs ADD COLUMN ended_at TEXT;
ALTER TABLE agent_runs ADD COLUMN session_summary_json TEXT;

UPDATE agent_runs SET started_at = created_at WHERE started_at IS NULL;

ALTER TABLE agent_run_steps ADD COLUMN step_kind TEXT;
ALTER TABLE agent_run_steps ADD COLUMN turn_index INTEGER;
ALTER TABLE agent_run_steps ADD COLUMN tool_name TEXT;
ALTER TABLE agent_run_steps ADD COLUMN tool_input_json TEXT;
ALTER TABLE agent_run_steps ADD COLUMN tool_output_json TEXT;
ALTER TABLE agent_run_steps ADD COLUMN tool_latency_ms INTEGER;
ALTER TABLE agent_run_steps ADD COLUMN parent_step_id TEXT;

UPDATE agent_run_steps SET step_kind = 'llm' WHERE step_kind IS NULL AND model IS NOT NULL;
UPDATE agent_run_steps SET step_kind = 'system' WHERE step_kind IS NULL;

CREATE INDEX IF NOT EXISTS idx_agent_run_steps_run_turn
  ON agent_run_steps(agent_run_id, turn_index, created_at);
