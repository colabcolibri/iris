ALTER TABLE meta_webhook_events ADD COLUMN conversation_id TEXT REFERENCES conversations(id);
ALTER TABLE meta_webhook_events ADD COLUMN message_id TEXT REFERENCES messages(id);
