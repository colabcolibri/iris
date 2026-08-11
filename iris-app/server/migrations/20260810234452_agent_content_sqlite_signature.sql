CREATE TABLE IF NOT EXISTS agent_content (
  id TEXT PRIMARY KEY,
  soul TEXT NOT NULL,
  page TEXT NOT NULL,
  knowledge TEXT NOT NULL DEFAULT '',
  restrictions TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

ALTER TABLE reply_persona ADD COLUMN signature_instruction TEXT NOT NULL DEFAULT '';
