ALTER TABLE app_settings ADD COLUMN reply_mode TEXT NOT NULL DEFAULT 'auto';

UPDATE app_settings
SET reply_mode = CASE WHEN auto_reply_enabled = 1 THEN 'auto' ELSE 'off' END;
