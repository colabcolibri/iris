ALTER TABLE app_settings ADD COLUMN agent_reply_tick_interval_seconds INTEGER NOT NULL DEFAULT 300;

UPDATE app_settings
SET reply_delay_seconds = 0
WHERE reply_delay_seconds > 0 AND reply_delay_seconds < 60;

UPDATE app_settings
SET message_reply_delay_seconds = 0
WHERE message_reply_delay_seconds > 0 AND message_reply_delay_seconds < 60;
