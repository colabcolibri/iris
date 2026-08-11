-- Persist Meta engagement counts for inbox list (likes / reported comments).
ALTER TABLE posts ADD COLUMN like_count INTEGER;
ALTER TABLE posts ADD COLUMN reported_comments_count INTEGER;
