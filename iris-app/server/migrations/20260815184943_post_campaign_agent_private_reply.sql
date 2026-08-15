-- Campanha interativa: agente ativo por dias no post + private reply após comentário
ALTER TABLE posts ADD COLUMN agent_active_days INTEGER;
ALTER TABLE posts ADD COLUMN private_reply_mode TEXT NOT NULL DEFAULT 'inherit';

ALTER TABLE app_settings ADD COLUMN private_reply_mode TEXT NOT NULL DEFAULT 'off';

ALTER TABLE comment_replies ADD COLUMN channel TEXT NOT NULL DEFAULT 'public';
ALTER TABLE comment_replies ADD COLUMN published_ig_message_id TEXT;

UPDATE comment_replies SET channel = 'public' WHERE channel IS NULL OR trim(channel) = '';
