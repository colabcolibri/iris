-- Normalize Meta offset format on conversations.last_message_at (same issue as messages).
UPDATE conversations
SET last_message_at = substr(replace(last_message_at, '+0000', '+00:00'), 1, 19) || '.000Z'
WHERE last_message_at GLOB '*+0000'
  AND last_message_at NOT GLOB '*.000Z';

-- Backfill from the latest stored message when the cached timestamp is stale.
UPDATE conversations
SET last_message_at = (
  SELECT MAX(COALESCE(m.ig_timestamp, m.created_at))
  FROM messages m
  WHERE m.conversation_id = conversations.id
)
WHERE EXISTS (
  SELECT 1
  FROM messages m
  WHERE m.conversation_id = conversations.id
    AND datetime(COALESCE(m.ig_timestamp, m.created_at)) >
      datetime(COALESCE(conversations.last_message_at, '1970-01-01T00:00:00.000Z'))
);
