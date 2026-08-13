ALTER TABLE conversations ADD COLUMN participant_display_name TEXT;
ALTER TABLE conversations ADD COLUMN participant_avatar_url TEXT;

ALTER TABLE messages ADD COLUMN attachment_url TEXT;
ALTER TABLE messages ADD COLUMN attachment_media_type TEXT;
