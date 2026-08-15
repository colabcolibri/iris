import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  CommentRepository,
  UpsertCommentInput,
  CommentReplyChannel,
  CommentReplyRecord,
} from "../../ports/comment-repository.ts";
import type { Comment } from "../../domain/comments/comment.ts";
import type { CommentActivityKind } from "../../domain/comments/list-comment-activity.ts";
import type { CommentActivityRow } from "../../domain/comments/list-comment-activity.ts";
import { AGENT_REPLY_EDIT_SKIP_REASON } from "../../domain/agent-reply/agent-reply-debounce.ts";
import { normalizeCommentTimestamp } from "../../domain/comments/normalize-comment-timestamp.ts";
import { mapCommentRow } from "./mappers.ts";

function mapReplyRecord(row: Record<string, unknown>): CommentReplyRecord {
  return {
    id: String(row.id),
    commentId: String(row.comment_id),
    channel: row.channel === "private" ? "private" : "public",
    draftText: typeof row.draft_text === "string" ? row.draft_text : null,
    sentText: typeof row.sent_text === "string" ? row.sent_text : null,
    status: String(row.status),
    sourceIgCommentId:
      typeof row.source_ig_comment_id === "string" ? row.source_ig_comment_id : null,
    replyToIgCommentId:
      typeof row.reply_to_ig_comment_id === "string" ? row.reply_to_ig_comment_id : null,
    publishedIgMessageId:
      typeof row.published_ig_message_id === "string" ? row.published_ig_message_id : null,
  };
}

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
    SELECT * FROM comments
    WHERE post_id = ?
    ORDER BY datetime(COALESCE(ig_timestamp, created_at)) ASC, ig_comment_id ASC
  `);
  const countByPostIdStmt = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
    FROM comments
    WHERE post_id = ?
      AND deleted_at IS NULL
  `);

  const markRepliedStmt = db.prepare(`
    UPDATE comments
    SET status = 'replied', error_message = NULL
    WHERE id = ?
  `);

  const markPendingStmt = db.prepare(`
    UPDATE comments
    SET status = 'pending', error_message = NULL
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
  `);

  const clearAgentReplyScheduleStmt = db.prepare(`
    UPDATE comments
    SET agent_reply_not_before = NULL
    WHERE id = ?
  `);

  const insertReply = db.prepare(`
    INSERT INTO comment_replies (
      id, comment_id, draft_text, sent_text, status, agent_run_id,
      source_ig_comment_id, reply_to_ig_comment_id, channel, published_ig_message_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const hasReplyRecordStmt = db.prepare(`
    SELECT 1 FROM comment_replies WHERE comment_id = ? AND channel = 'public' LIMIT 1
  `);

  const hasPrivateReplyRecordStmt = db.prepare(`
    SELECT 1 FROM comment_replies WHERE comment_id = ? AND channel = 'private' LIMIT 1
  `);

  const promoteDraftToSentStmt = db.prepare(`
    UPDATE comment_replies
    SET status = 'sent',
        sent_text = ?,
        draft_text = NULL,
        reply_to_ig_comment_id = COALESCE(?, reply_to_ig_comment_id),
        source_ig_comment_id = COALESCE(?, source_ig_comment_id),
        published_ig_message_id = COALESCE(?, published_ig_message_id)
    WHERE comment_id = ? AND status = 'draft' AND channel = ?
  `);

  const findLatestSentReplyStmt = db.prepare(`
    SELECT * FROM comment_replies
    WHERE comment_id = ? AND status = 'sent' AND sent_text IS NOT NULL AND channel = ?
    ORDER BY rowid DESC
    LIMIT 1
  `);

  const findLatestDraftStmt = db.prepare(`
    SELECT * FROM comment_replies
    WHERE comment_id = ? AND status = 'draft' AND channel = ?
    ORDER BY rowid DESC
    LIMIT 1
  `);

  const clearDraftStmt = db.prepare(`
    DELETE FROM comment_replies
    WHERE comment_id = ? AND status = 'draft' AND channel = 'public'
  `);

  const updateDraftStmt = db.prepare(`
    UPDATE comment_replies
    SET draft_text = ?
    WHERE comment_id = ? AND status = 'draft' AND channel = 'public'
  `);

  const updateDraftByIdStmt = db.prepare(`
    UPDATE comment_replies
    SET draft_text = ?
    WHERE id = ? AND status = 'draft'
  `);

  const deleteExtraDraftsStmt = db.prepare(`
    DELETE FROM comment_replies
    WHERE comment_id = ? AND status = 'draft' AND channel = ? AND id <> ?
  `);

  const agentWorkFilterSql = `
    (
      (
        c.status = 'pending'
        AND (
          CASE
            WHEN p.reply_mode = 'inherit' THEN COALESCE(s.reply_mode, 'auto')
            ELSE p.reply_mode
          END
        ) IN ('auto', 'draft')
        AND NOT EXISTS (
          SELECT 1 FROM comment_replies cr
          WHERE cr.comment_id = c.id AND cr.channel = 'public'
        )
      )
      OR (
        (
          CASE
            WHEN p.private_reply_mode = 'inherit' THEN COALESCE(s.private_reply_mode, 'off')
            ELSE p.private_reply_mode
          END
        ) IN ('auto', 'draft')
        AND NOT EXISTS (
          SELECT 1 FROM comment_replies cr
          WHERE cr.comment_id = c.id AND cr.channel = 'private'
        )
        AND (
          c.status = 'replied'
          OR (
            c.status = 'pending'
            AND (
              CASE
                WHEN p.reply_mode = 'inherit' THEN COALESCE(s.reply_mode, 'auto')
                ELSE p.reply_mode
              END
            ) = 'off'
          )
        )
      )
    )
  `;

  const listPendingForAgentReplyStmt = db.prepare(`
    SELECT c.*, p.caption AS post_caption, p.reply_mode AS reply_mode
    FROM comments c
    INNER JOIN posts p ON p.id = c.post_id
    LEFT JOIN app_settings s ON s.id = 'primary'
    WHERE c.deleted_at IS NULL
      AND ${agentWorkFilterSql}
      AND c.agent_reply_not_before IS NOT NULL
      AND datetime(c.agent_reply_not_before) <= datetime('now')
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

  const listScheduledForAgentReplyStmt = db.prepare(`
    SELECT c.*, p.caption AS post_caption, p.reply_mode AS reply_mode
    FROM comments c
    INNER JOIN posts p ON p.id = c.post_id
    LEFT JOIN app_settings s ON s.id = 'primary'
    WHERE c.deleted_at IS NULL
      AND ${agentWorkFilterSql}
      AND c.agent_reply_not_before IS NOT NULL
      AND (
        c.author_username IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM meta_connection mc
          WHERE mc.id = 'primary'
            AND mc.ig_username IS NOT NULL
            AND lower(trim(c.author_username)) = lower(trim(mc.ig_username))
        )
      )
    ORDER BY datetime(c.agent_reply_not_before) ASC
  `);

  const listSentRepliesByPostIdStmt = db.prepare(`
    SELECT cr.comment_id, cr.sent_text
    FROM comment_replies cr
    INNER JOIN comments c ON c.id = cr.comment_id
    WHERE c.post_id = ? AND cr.status = 'sent' AND cr.sent_text IS NOT NULL
  `);

  const postPendingCountSql = `
    (
      SELECT COUNT(*)
      FROM comments pc
      WHERE pc.post_id = p.id
        AND pc.status = 'pending'
        AND pc.deleted_at IS NULL
    ) AS post_pending_count
  `;

  const managedPostFilterSql = `
    p.ig_media_id IS NOT NULL
    AND p.status IN ('published', 'monitored')
  `;

  const listPendingApprovalActivityStmt = db.prepare(`
    SELECT
      c.id AS comment_id,
      c.post_id AS post_id,
      p.ig_media_id AS ig_media_id,
      c.author_username AS author_username,
      c.text AS text,
      c.status AS comment_status,
      COALESCE(c.ig_timestamp, c.created_at) AS occurred_at,
      cr.draft_text AS draft_text,
      NULL AS sent_text,
      p.caption AS post_caption,
      ${postPendingCountSql}
    FROM comments c
    INNER JOIN comment_replies cr ON cr.comment_id = c.id AND cr.status = 'draft'
    INNER JOIN posts p ON p.id = c.post_id
    WHERE c.status = 'pending'
      AND c.deleted_at IS NULL
      AND cr.draft_text IS NOT NULL
      AND ${managedPostFilterSql}
    ORDER BY cr.rowid DESC
    LIMIT ?
  `);

  const listRecentPublicActivityWithBrandStmt = db.prepare(`
    SELECT
      c.id AS comment_id,
      c.post_id AS post_id,
      p.ig_media_id AS ig_media_id,
      c.author_username AS author_username,
      c.text AS text,
      c.status AS comment_status,
      COALESCE(c.ig_timestamp, c.created_at) AS occurred_at,
      NULL AS draft_text,
      NULL AS sent_text,
      p.caption AS post_caption,
      ${postPendingCountSql}
    FROM comments c
    INNER JOIN posts p ON p.id = c.post_id
    WHERE c.deleted_at IS NULL
      AND ${managedPostFilterSql}
      AND NOT EXISTS (
        SELECT 1 FROM comment_replies cr
        WHERE cr.comment_id = c.id AND cr.status = 'draft' AND cr.draft_text IS NOT NULL
      )
      AND (
        c.author_username IS NULL
        OR lower(trim(c.author_username)) != lower(trim(?))
      )
    ORDER BY datetime(COALESCE(c.ig_timestamp, c.created_at)) DESC
    LIMIT ?
  `);

  const listRecentPublicActivityWithoutBrandStmt = db.prepare(`
    SELECT
      c.id AS comment_id,
      c.post_id AS post_id,
      p.ig_media_id AS ig_media_id,
      c.author_username AS author_username,
      c.text AS text,
      c.status AS comment_status,
      COALESCE(c.ig_timestamp, c.created_at) AS occurred_at,
      NULL AS draft_text,
      NULL AS sent_text,
      p.caption AS post_caption,
      ${postPendingCountSql}
    FROM comments c
    INNER JOIN posts p ON p.id = c.post_id
    WHERE c.deleted_at IS NULL
      AND ${managedPostFilterSql}
      AND NOT EXISTS (
        SELECT 1 FROM comment_replies cr
        WHERE cr.comment_id = c.id AND cr.status = 'draft' AND cr.draft_text IS NOT NULL
      )
    ORDER BY datetime(COALESCE(c.ig_timestamp, c.created_at)) DESC
    LIMIT ?
  `);

  const listRecentIrisActivityStmt = db.prepare(`
    SELECT
      c.id AS comment_id,
      c.post_id AS post_id,
      p.ig_media_id AS ig_media_id,
      c.author_username AS author_username,
      c.text AS text,
      c.status AS comment_status,
      COALESCE(c.ig_timestamp, c.created_at) AS occurred_at,
      NULL AS draft_text,
      cr.sent_text AS sent_text,
      p.caption AS post_caption,
      ${postPendingCountSql}
    FROM comment_replies cr
    INNER JOIN comments c ON c.id = cr.comment_id
    INNER JOIN posts p ON p.id = c.post_id
    WHERE cr.status = 'sent'
      AND cr.sent_text IS NOT NULL
      AND c.deleted_at IS NULL
      AND ${managedPostFilterSql}
    ORDER BY cr.rowid DESC
    LIMIT ?
  `);

  type ActivityRowRecord = {
    comment_id: string;
    post_id: string;
    ig_media_id: string | null;
    author_username: string | null;
    text: string | null;
    comment_status: string;
    occurred_at: string;
    draft_text: string | null;
    sent_text: string | null;
    post_caption: string | null;
    post_pending_count: number;
  };

  function mapActivityRow(row: ActivityRowRecord): CommentActivityRow {
    return {
      commentId: row.comment_id,
      postId: row.post_id,
      igMediaId: row.ig_media_id,
      authorUsername: row.author_username,
      text: row.text,
      commentStatus: row.comment_status,
      occurredAt: row.occurred_at,
      draftText: row.draft_text,
      sentText: row.sent_text,
      postCaption: row.post_caption,
      postPendingCount: Number(row.post_pending_count ?? 0),
    };
  }

  const updateFromWebhookStmt = db.prepare(`
    UPDATE comments
    SET parent_ig_comment_id = ?,
        text = ?,
        author_username = COALESCE(?, author_username),
        ig_timestamp = CASE WHEN ? IS NOT NULL THEN ? ELSE ig_timestamp END,
        deleted_at = NULL
    WHERE ig_comment_id = ?
  `);

  const restoreFromInstagramStmt = db.prepare(`
    UPDATE comments
    SET deleted_at = NULL
    WHERE id = ?
      AND deleted_at IS NOT NULL
  `);

  const markDeletedFromInstagramStmt = db.prepare(`
    UPDATE comments
    SET deleted_at = ?,
        agent_reply_not_before = NULL
    WHERE id = ?
      AND deleted_at IS NULL
  `);

  function readCommentById(id: string): Comment | null {
    const row = selectById.get(id);
    return row ? mapCommentRow(row as never) : null;
  }

  return {
    upsertFromWebhook(input: UpsertCommentInput) {
      const existing = selectByIgCommentId.get(input.igCommentId);

      if (existing) {
        const current = mapCommentRow(existing as never);
        const nextParent = input.parentIgCommentId ?? null;
        const nextText = input.text ?? null;
        const nextTimestamp = normalizeCommentTimestamp(input.igTimestamp);
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
            nextTimestamp,
            input.igCommentId,
          );

          if (
            textChanged &&
            current.status === "pending" &&
            (current.agentReplyNotBefore != null || current.text != null)
          ) {
            clearAgentReplyScheduleStmt.run(current.id);
            markSkippedStmt.run(AGENT_REPLY_EDIT_SKIP_REASON, current.id);
          }

          const updated = selectByIgCommentId.get(input.igCommentId);
          return { comment: mapCommentRow(updated as never), created: false };
        }

        if (current.deletedAt) {
          restoreFromInstagramStmt.run(current.id);
          const restored = selectByIgCommentId.get(input.igCommentId);
          return { comment: mapCommentRow(restored as never), created: false };
        }

        return { comment: current, created: false };
      }

      const now = new Date().toISOString();
      const igTimestamp = normalizeCommentTimestamp(input.igTimestamp);
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

    listScheduledForAgentReply() {
      return listScheduledForAgentReplyStmt.all().map((row) => {
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

    hasPrivateReplyRecord(commentId) {
      return Boolean(hasPrivateReplyRecordStmt.get(commentId));
    },

    promoteDraftToSent(commentId, sentText, meta) {
      const channel: CommentReplyChannel = meta?.channel ?? "public";
      const result = promoteDraftToSentStmt.run(
        sentText,
        meta?.replyToIgCommentId ?? null,
        meta?.sourceIgCommentId ?? null,
        meta?.publishedIgMessageId ?? null,
        commentId,
        channel,
      );
      return result.changes > 0;
    },

    findLatestSentReply(commentId, channel = "public") {
      const row = findLatestSentReplyStmt.get(commentId, channel);
      return row ? mapReplyRecord(row as Record<string, unknown>) : null;
    },

    findLatestDraft(commentId, channel = "public") {
      const row = findLatestDraftStmt.get(commentId, channel);
      return row ? mapReplyRecord(row as Record<string, unknown>) : null;
    },

    clearDraft(commentId) {
      const result = clearDraftStmt.run(commentId);
      return (result.changes ?? 0) > 0;
    },

    updateDraft(commentId, draftText) {
      const result = updateDraftStmt.run(draftText, commentId);
      return (result.changes ?? 0) > 0;
    },

    upsertDraft(commentId, draftText, options = {}) {
      const channel: CommentReplyChannel = options.channel ?? "public";
      const existing = findLatestDraftStmt.get(commentId, channel) as
        | Record<string, unknown>
        | undefined;

      if (existing) {
        updateDraftByIdStmt.run(draftText, existing.id);
        deleteExtraDraftsStmt.run(commentId, channel, existing.id);
        return mapReplyRecord({ ...existing, draft_text: draftText });
      }

      const id = randomUUID();
      insertReply.run(
        id,
        commentId,
        draftText,
        null,
        "draft",
        options.agentRunId ?? null,
        null,
        null,
        channel,
        null,
      );
      return mapReplyRecord({
        id,
        comment_id: commentId,
        draft_text: draftText,
        sent_text: null,
        status: "draft",
        source_ig_comment_id: null,
        reply_to_ig_comment_id: null,
        channel,
        published_ig_message_id: null,
      });
    },

    markDeletedFromInstagram(commentId) {
      const result = markDeletedFromInstagramStmt.run(
        new Date().toISOString(),
        commentId,
      );
      return (result.changes ?? 0) > 0;
    },

    restoreFromInstagram(commentId) {
      const result = restoreFromInstagramStmt.run(commentId);
      return (result.changes ?? 0) > 0;
    },

    findById(id) {
      return readCommentById(id);
    },

    markReplied(id) {
      markRepliedStmt.run(id);
      return readCommentById(id);
    },

    markPending(id) {
      markPendingStmt.run(id);
      return readCommentById(id);
    },

    markSkipped(id, errorMessage = null) {
      markSkippedStmt.run(errorMessage, id);
      return readCommentById(id);
    },

    markFailed(id, errorMessage) {
      markFailedStmt.run(errorMessage.slice(0, 500), id);
      return readCommentById(id);
    },

    scheduleAgentReply(commentId, notBeforeIso) {
      const result = scheduleAgentReplyStmt.run(notBeforeIso, commentId);
      return (result.changes ?? 0) > 0;
    },

    clearAgentReplySchedule(commentId) {
      clearAgentReplyScheduleStmt.run(commentId);
    },

    createReply(input) {
      const channel: CommentReplyChannel = input.channel ?? "public";
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
        channel,
        input.publishedIgMessageId ?? null,
      );
      return mapReplyRecord({
        id,
        comment_id: input.commentId,
        draft_text: input.draftText ?? null,
        sent_text: input.sentText ?? null,
        status: input.status,
        source_ig_comment_id: input.sourceIgCommentId ?? null,
        reply_to_ig_comment_id: input.replyToIgCommentId ?? null,
        channel,
        published_ig_message_id: input.publishedIgMessageId ?? null,
      });
    },

    linkInstagramReply(input) {
      if (Boolean(hasReplyRecordStmt.get(input.userCommentId))) {
        return false;
      }

      const userComment = readCommentById(input.userCommentId);

      const id = randomUUID();
      insertReply.run(
        id,
        input.userCommentId,
        null,
        input.sentText,
        "sent",
        null,
        input.brandIgCommentId,
        userComment?.igCommentId ?? null,
        "public",
        null,
      );
      markRepliedStmt.run(input.userCommentId);
      return true;
    },

    listActivityRows(kind: CommentActivityKind, limit: number, brandUsername: string | null) {
      if (kind === "pending_approval") {
        return listPendingApprovalActivityStmt
          .all(limit)
          .map((row) => mapActivityRow(row as ActivityRowRecord));
      }

      if (kind === "recent_public") {
        const rows = brandUsername?.trim()
          ? listRecentPublicActivityWithBrandStmt.all(brandUsername.trim(), limit)
          : listRecentPublicActivityWithoutBrandStmt.all(limit);
        return rows.map((row) => mapActivityRow(row as ActivityRowRecord));
      }

      return listRecentIrisActivityStmt
        .all(limit)
        .map((row) => mapActivityRow(row as ActivityRowRecord));
    },
  };
}
