ALTER TABLE conversations ADD COLUMN ai_locked_until TEXT;
ALTER TABLE conversations ADD COLUMN ai_locked_at TEXT;
ALTER TABLE conversations ADD COLUMN ai_locked_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_conversations_ai_locked_until
  ON conversations (ai_locked_until)
  WHERE ai_locked_until IS NOT NULL;
