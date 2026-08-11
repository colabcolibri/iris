-- Mantém só o rascunho mais recente por comentário.
DELETE FROM comment_replies
WHERE status = 'draft'
  AND id NOT IN (
    SELECT cr.id
    FROM comment_replies cr
    INNER JOIN (
      SELECT comment_id, MAX(rowid) AS max_rowid
      FROM comment_replies
      WHERE status = 'draft'
      GROUP BY comment_id
    ) latest ON latest.comment_id = cr.comment_id AND latest.max_rowid = cr.rowid
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_replies_one_draft_per_comment
  ON comment_replies(comment_id)
  WHERE status = 'draft';

-- Mescla comentários duplicados pelo mesmo ig_comment_id (se existirem).
UPDATE comment_replies
SET comment_id = (
  SELECT c_keep.id
  FROM comments c_keep
  INNER JOIN comments c_dup ON c_dup.ig_comment_id = c_keep.ig_comment_id
  WHERE c_dup.id = comment_replies.comment_id
  ORDER BY datetime(c_keep.created_at) ASC, c_keep.id ASC
  LIMIT 1
)
WHERE comment_id IN (
  SELECT c_dup.id
  FROM comments c_dup
  WHERE EXISTS (
    SELECT 1
    FROM comments c_other
    WHERE c_other.ig_comment_id = c_dup.ig_comment_id
      AND c_other.id <> c_dup.id
      AND datetime(c_other.created_at) < datetime(c_dup.created_at)
  )
);

UPDATE meta_webhook_events
SET comment_id = (
  SELECT c_keep.id
  FROM comments c_keep
  INNER JOIN comments c_dup ON c_dup.ig_comment_id = c_keep.ig_comment_id
  WHERE c_dup.id = meta_webhook_events.comment_id
  ORDER BY datetime(c_keep.created_at) ASC, c_keep.id ASC
  LIMIT 1
)
WHERE comment_id IN (
  SELECT c_dup.id
  FROM comments c_dup
  WHERE EXISTS (
    SELECT 1
    FROM comments c_other
    WHERE c_other.ig_comment_id = c_dup.ig_comment_id
      AND c_other.id <> c_dup.id
      AND datetime(c_other.created_at) < datetime(c_dup.created_at)
  )
);

DELETE FROM comments
WHERE id IN (
  SELECT c_dup.id
  FROM comments c_dup
  WHERE EXISTS (
    SELECT 1
    FROM comments c_other
    WHERE c_other.ig_comment_id = c_dup.ig_comment_id
      AND c_other.id <> c_dup.id
      AND datetime(c_other.created_at) < datetime(c_dup.created_at)
  )
);
