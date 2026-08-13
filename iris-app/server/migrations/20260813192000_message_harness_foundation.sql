ALTER TABLE agent_run_steps ADD COLUMN message_id TEXT REFERENCES messages(id);

CREATE INDEX IF NOT EXISTS idx_agent_run_steps_message_id
  ON agent_run_steps(message_id)
  WHERE message_id IS NOT NULL;

ALTER TABLE app_settings ADD COLUMN message_auto_reply_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE app_settings ADD COLUMN message_reply_mode TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE app_settings ADD COLUMN message_reply_delay_seconds INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS message_agent_content (
  id TEXT PRIMARY KEY,
  dm_soul TEXT NOT NULL,
  dm_page TEXT NOT NULL,
  dm_knowledge TEXT NOT NULL DEFAULT '',
  dm_restrictions TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
