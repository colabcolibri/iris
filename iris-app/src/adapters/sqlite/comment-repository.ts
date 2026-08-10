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
      id, ig_comment_id, post_id, parent_ig_comment_id, author_username, text, status, error_message, created_at, ig_timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, ?, ?)
  `);

  const selectByIgCommentId = db.prepare(
    "SELECT * FROM comments WHERE ig_comment_id = ?",
  );
  const selectById = db.prepare("SELECT * FROM comments WHERE id = ?");
  const listByPostId = db.prepare(`
    SELECT * FROM comments WHERE post_id = ? ORDER BY datetime(created_at) ASC
  `);
  const countByPostIdStmt = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
    FROM comments
    WHERE post_id = ?
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

  const markSkippedStmt = db.prepare(`
    UPDATE comments
    SET status = 'skipped', error_message = ?
    WHERE id = ?
  `);

  const scheduleAgentReplyStmt = db.prepare(`
    UPDATE comments
    SET agent_reply_not_before = ?
    WHERE id = ?
      AND status = 'pending'
      AND agent_reply_not_before IS NULL
  `);

  const insertReply = db.prepare(`
    INSERT INTO comment_replies (id, comment_id, draft_text, sent_text, status, agent_run_id, source_ig_comment_id, reply_to_ig_comment_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const hasReplyRecordStmt = db.prepare(`
    SELECT 1 FROM comment_replies WHERE comment_id = ? LIMIT 1
  `);

  const promoteDraftToSentStmt = db.prepare(`
    UPDATE comment_replies
    SET status = 'sent',
        sent_text = ?,
        draft_text = NULL,
        reply_to_ig_comment_id = COALESCE(?, reply_to_ig_comment_id),
        source_ig_comment_id = COALESCE(?, source_ig_comment_id)
    WHERE comment_id = ? AND status = 'draft'
  `);

  const findLatestSentReplyStmt = db.prepare(`
    SELECT * FROM comment_replies
    WHERE comment_id = ? AND status = 'sent' AND sent_text IS NOT NULL
    ORDER BY rowid DESC
    LIMIT 1
  `);

  const findLatestDraftStmt = db.prepare(`
    SELECT * FROM comment_replies
    WHERE comment_id = ? AND status = 'draft'
    ORDER BY rowid DESC
    LIMIT 1
  `);

  const listPendingForAgentReplyStmt = db.prepare(`
    SELECT c.*, p.caption AS post_caption, p.reply_mode AS reply_mode
    FROM comments c
    INNER JOIN posts p ON p.id = c.post_id
    LEFT JOIN app_settings s ON s.id = 'primary'
    WHERE c.status = 'pending'
      AND (
        CASE
          WHEN p.reply_mode = 'inherit' THEN COALESCE(s.reply_mode, 'auto')
          ELSE p.reply_mode
        END
      ) IN ('auto', 'draft')
      AND NOT EXISTS (
        SELECT 1 FROM comment_replies cr WHERE cr.comment_id = c.id
      )
      AND (
        c.agent_reply_not_before IS NULL
        OR datetime(c.agent_reply_not_before) <= datetime('now')
      )
      AND (
        c.author_username IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM meta_connection mc
          WHERE mc.id = 'primary'
            AND mc.ig_username IS NOT NULL
            AND lower(trim(c.author_username)) = lower(trim(mc.ig_username))
        )
      )
    ORDER BY datetime(COALESCE(c.ig_timestamp, c.created_at)) ASC
  `);

  const listSentRepliesByPostIdStmt = db.prepare(`
    SELECT cr.comment_id, cr.sent_text
    FROM comment_replies cr
    INNER JOIN comments c ON c.id = cr.comment_id
    WHERE c.post_id = ? AND cr.status = 'sent' AND cr.sent_text IS NOT NULL
  `);

  const updateFromWebhookStmt = db.prepare(`
    UPDATE comments
    SET parent_ig_comment_id = ?, text = ?, author_username = COALESCE(?, author_username), ig_timestamp = COALESCE(?, ig_timestamp)
    WHERE ig_comment_id = ?
  `);

  return {
    upsertFromWebhook(input: UpsertCommentInput) {
      const existing = selectByIgCommentId.get(input.igCommentId);

      if (existing) {
        const current = mapCommentRow(existing as never);
        const nextParent = input.parentIgCommentId ?? null;
        const nextText = input.text ?? null;
        const nextTimestamp = input.igTimestamp ?? null;
        const parentChanged = nextParent !== current.parentIgCommentId;
        const textChanged = nextText !== current.text;
        const timestampChanged =
          nextTimestamp !== null && nextTimestamp !== current.igTimestamp;

        if (parentChanged || textChanged || timestampChanged) {
          updateFromWebhookStmt.run(
            nextParent,
            nextText,
            input.authorUsername ?? null,
            nextTimestamp,
            input.igCommentId,
          );
          const updated = selectByIgCommentId.get(input.igCommentId);
          return { comment: mapCommentRow(updated as never), created: false };
        }

        return { comment: current, created: false };
      }

      const now = new Date().toISOString();
      const igTimestamp = input.igTimestamp ?? now;
      const id = randomUUID();

      insert.run(
        id,
        input.igCommentId,
        input.postId,
        input.parentIgCommentId ?? null,
        input.authorUsername ?? null,
        input.text ?? null,
        now,
        igTimestamp,
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

    countByPostId(postId) {
      const row = countByPostIdStmt.get(postId) as
        | { total: number | string; pending: number | string | null }
        | undefined;
      return {
        total: Number(row?.total ?? 0),
        pending: Number(row?.pending ?? 0),
      };
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

    listPendingForAgentReply() {
      return listPendingForAgentReplyStmt.all().map((row) => {
        const record = row as Record<string, unknown>;
        return {
          ...mapCommentRow(row as never),
          postCaption: typeof record.post_caption === "string" ? record.post_caption : null,
          replyMode: typeof record.reply_mode === "string" ? record.reply_mode : "off",
        };
      });
    },

    hasReplyRecord(commentId) {
      return Boolean(hasReplyRecordStmt.get(commentId));
    },

    promoteDraftToSent(commentId, sentText, meta) {
      const result = promoteDraftToSentStmt.run(
        sentText,
        meta?.replyToIgCommentId ?? null,
        meta?.sourceIgCommentId ?? null,
        commentId,
      );
      return result.changes > 0;
    },

    findLatestSentReply(commentId) {
      const row = findLatestSentReplyStmt.get(commentId);
      if (!row) {
        return null;
      }

      const record = row as {
        id: string;
        comment_id: string;
        draft_text: string | null;
        sent_text: string | null;
        status: string;
        source_ig_comment_id?: string | null;
        reply_to_ig_comment_id?: string | null;
      };

      return {
        id: record.id,
        commentId: record.comment_id,
        draftText: record.draft_text,
        sentText: record.sent_text,
        status: record.status,
        sourceIgCommentId: record.source_ig_comment_id ?? null,
        replyToIgCommentId: record.reply_to_ig_comment_id ?? null,
      };
    },

    findLatestDraft(commentId) {
      const row = findLatestDraftStmt.get(commentId);
      if (!row) {
        return null;
      }

      const record = row as {
        id: string;
        comment_id: string;
        draft_text: string | null;
        sent_text: string | null;
        status: string;
        source_ig_comment_id?: string | null;
        reply_to_ig_comment_id?: string | null;
      };

      return {
        id: record.id,
        commentId: record.comment_id,
        draftText: record.draft_text,
        sentText: record.sent_text,
        status: record.status,
        sourceIgCommentId: record.source_ig_comment_id ?? null,
        replyToIgCommentId: record.reply_to_ig_comment_id ?? null,
      };
    },

    findById(id) {
      const row = selectById.get(id);
      return row ? mapCommentRow(row as never) : null;
    },

    markReplied(id) {
      markRepliedStmt.run(id);
      return this.findById(id);
    },

    markSkipped(id, errorMessage = null) {
      markSkippedStmt.run(errorMessage, id);
      return this.findById(id);
    },

    markFailed(id, errorMessage) {
      markFailedStmt.run(errorMessage.slice(0, 500), id);
      return this.findById(id);
    },

    scheduleAgentReply(commentId, notBeforeIso) {
      const result = scheduleAgentReplyStmt.run(notBeforeIso, commentId);
      return (result.changes ?? 0) > 0;
    },

    createReply(input) {
      const id = randomUUID();
      insertReply.run(
        id,
        input.commentId,
        input.draftText ?? null,
        input.sentText ?? null,
        input.status,
        input.agentRunId ?? null,
        input.sourceIgCommentId ?? null,
        input.replyToIgCommentId ?? null,
      );
      return {
        id,
        commentId: input.commentId,
        draftText: input.draftText ?? null,
        sentText: input.sentText ?? null,
        status: input.status,
        sourceIgCommentId: input.sourceIgCommentId ?? null,
        replyToIgCommentId: input.replyToIgCommentId ?? null,
      };
    },

    linkInstagramReply(input) {
      if (this.hasReplyRecord(input.userCommentId)) {
        return false;
      }

      const userComment = this.findById(input.userCommentId);

      this.createReply({
        commentId: input.userCommentId,
        sentText: input.sentText,
        status: "sent",
        sourceIgCommentId: input.brandIgCommentId,
        replyToIgCommentId: userComment?.igCommentId ?? null,
      });
      this.markReplied(input.userCommentId);
      return true;
    },
  };
}
