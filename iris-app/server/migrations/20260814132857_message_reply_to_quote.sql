ALTER TABLE messages ADD COLUMN reply_to_ig_message_id TEXT;
ALTER TABLE message_replies ADD COLUMN reply_to_ig_message_id TEXT;
