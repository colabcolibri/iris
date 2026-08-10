ALTER TABLE posts ADD COLUMN reply_mode TEXT NOT NULL DEFAULT 'off';

UPDATE posts
SET reply_mode = 'auto'
WHERE auto_reply_enabled = 1;
