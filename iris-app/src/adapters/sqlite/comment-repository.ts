import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  CommentRepository,
  UpsertCommentInput,
} from "../../ports/comment-repository.ts";
import type { Comment } from "../../domain/comment.ts";
import { mapCommentRow } from "./mappers.ts";

export function createSqliteCommentRepository(db: DatabaseSync): CommentRepository {
  const insert = db.prepare(`
    INSERT INTO comments (
      id, ig_comment_id, post_id, parent_ig_comment_id, author_username, text, status, error_message, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, ?)
  `);

  const selectByIgCommentId = db.prepare(
    "SELECT * FROM comments WHERE ig_comment_id = ?",
  );
  const selectById = db.prepare("SELECT * FROM comments WHERE id = ?");
  const listByPostId = db.prepare(`
    SELECT * FROM comments WHERE post_id = ? ORDER BY datetime(created_at) ASC
  `);

  const markRepliedStmt = db.prepare(`
    UPDATE comments
    SET status = 'replied', error_message = NULL
    WHERE id = ?
  `);

  const markFailedStmt = db.prepare(`
    UPDATE comments
    SET status = 'failed', error_message = ?
    WHERE id = ?
  `);

  const insertReply = db.prepare(`
    INSERT INTO comment_replies (id, comment_id, draft_text, sent_text, status, agent_run_id)
    VALUES (?, ?, NULL, ?, ?, ?)
  `);

  const listPendingForAutoReplyStmt = db.prepare(`
    SELECT c.*, p.caption AS post_caption
    FROM comments c
    INNER JOIN posts p ON p.id = c.post_id
    WHERE c.status = 'pending' AND p.auto_reply_enabled = 1
    ORDER BY datetime(c.created_at) ASC
  `);

  const listSentRepliesByPostIdStmt = db.prepare(`
    SELECT cr.comment_id, cr.sent_text
    FROM comment_replies cr
    INNER JOIN comments c ON c.id = cr.comment_id
    WHERE c.post_id = ? AND cr.status = 'sent' AND cr.sent_text IS NOT NULL
  `);

  const updateFromWebhookStmt = db.prepare(`
    UPDATE comments
    SET parent_ig_comment_id = ?, text = ?, author_username = COALESCE(?, author_username)
    WHERE ig_comment_id = ?
  `);

  return {
    upsertFromWebhook(input: UpsertCommentInput) {
      const existing = selectByIgCommentId.get(input.igCommentId);

      if (existing) {
        const current = mapCommentRow(existing as never);
        const nextParent = input.parentIgCommentId ?? null;
        const nextText = input.text ?? null;
        const parentChanged = nextParent !== current.parentIgCommentId;
        const textChanged = nextText !== current.text;

        if (parentChanged || textChanged) {
          updateFromWebhookStmt.run(
            nextParent,
            nextText,
            input.authorUsername ?? null,
            input.igCommentId,
          );
          const updated = selectByIgCommentId.get(input.igCommentId);
          return { comment: mapCommentRow(updated as never), created: false };
        }

        return { comment: current, created: false };
      }

      const now = new Date().toISOString();
      const id = randomUUID();

      insert.run(
        id,
        input.igCommentId,
        input.postId,
        input.parentIgCommentId ?? null,
        input.authorUsername ?? null,
        input.text ?? null,
        now,
      );

      const row = selectByIgCommentId.get(input.igCommentId);
      return { comment: mapCommentRow(row as never), created: true };
    },

    findByIgCommentId(igCommentId) {
      const row = selectByIgCommentId.get(igCommentId);
      return row ? mapCommentRow(row as never) : null;
    },

    listByPostId(postId) {
      return listByPostId.all(postId).map((row) => mapCommentRow(row as never));
    },

    listSentRepliesByPostId(postId) {
      return listSentRepliesByPostIdStmt.all(postId).map((row) => {
        const record = row as { comment_id: string; sent_text: string };
        return {
          commentId: record.comment_id,
          sentText: record.sent_text,
        };
      });
    },

    listPendingForAutoReply() {
      return listPendingForAutoReplyStmt.all().map((row) => {
        const record = row as Record<string, unknown>;
        return {
          ...mapCommentRow(row as never),
          postCaption: typeof record.post_caption === "string" ? record.post_caption : null,
        };
      });
    },

    findById(id) {
      const row = selectById.get(id);
      return row ? mapCommentRow(row as never) : null;
    },

    markReplied(id) {
      markRepliedStmt.run(id);
      return this.findById(id);
    },

    markFailed(id, errorMessage) {
      markFailedStmt.run(errorMessage.slice(0, 500), id);
      return this.findById(id);
    },

    createReply(commentId, sentText, status, agentRunId = null) {
      const id = randomUUID();
      insertReply.run(id, commentId, sentText, status, agentRunId);
      return {
        id,
        commentId,
        sentText,
        status,
      };
    },
  };
}
