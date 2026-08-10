ALTER TABLE comments ADD COLUMN agent_reply_not_before TEXT;

ALTER TABLE app_settings ADD COLUMN reply_delay_seconds INTEGER NOT NULL DEFAULT 0;
