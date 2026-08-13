CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  ig_conversation_id TEXT NOT NULL UNIQUE,
  participant_ig_user_id TEXT NOT NULL,
  participant_username TEXT,
  last_message_at TEXT,
  reply_mode TEXT NOT NULL DEFAULT 'inherit',
  reply_prompt TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_participant
  ON conversations(participant_ig_user_id);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  ig_message_id TEXT NOT NULL UNIQUE,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  direction TEXT NOT NULL,
  text TEXT,
  ig_timestamp TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  agent_reply_not_before TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(conversation_id, ig_timestamp);

CREATE INDEX IF NOT EXISTS idx_messages_queue
  ON messages(status, agent_reply_not_before)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS message_replies (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES messages(id),
  draft_text TEXT,
  sent_text TEXT,
  status TEXT NOT NULL,
  agent_run_id TEXT REFERENCES agent_runs(id),
  source_ig_message_id TEXT,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_message_replies_one_draft
  ON message_replies(message_id)
  WHERE status = 'draft';
