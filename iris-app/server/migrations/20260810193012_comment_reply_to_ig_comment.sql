ALTER TABLE comment_replies ADD COLUMN reply_to_ig_comment_id TEXT;

UPDATE comment_replies
SET reply_to_ig_comment_id = (
  SELECT c.ig_comment_id FROM comments c WHERE c.id = comment_replies.comment_id
)
WHERE reply_to_ig_comment_id IS NULL
  AND status = 'sent'
  AND comment_id IS NOT NULL;
