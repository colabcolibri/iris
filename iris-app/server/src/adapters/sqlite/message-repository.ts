import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  CreateMessageReplyInput,
  MessageReplyRepository,
  MessageRepository,
  PendingAgentReplyMessage,
  UpsertInboundMessageInput,
  UpsertMessageDraftInput,
  UpsertOutboundMessageInput,
} from "../../ports/message-repository.ts";
import type {
  MessageActivityKind,
  MessageActivityRow,
} from "../../domain/messages/list-message-activity.ts";
import { mapMessageReplyRow, mapMessageRow } from "./message-mappers.ts";

export function createSqliteMessageRepository(db: DatabaseSync): MessageRepository {
  const selectById = db.prepare("SELECT * FROM messages WHERE id = ?");
  const selectByIgMessageId = db.prepare(
    "SELECT * FROM messages WHERE ig_message_id = ?",
  );
  const listByConversation = db.prepare(`
    SELECT * FROM messages
    WHERE conversation_id = ?
    ORDER BY datetime(COALESCE(ig_timestamp, created_at)) ASC, ig_message_id ASC
  `);

  const insertInbound = db.prepare(`
    INSERT INTO messages (
      id, ig_message_id, conversation_id, direction, text, ig_timestamp,
      status, error_message, agent_reply_not_before, created_at
    ) VALUES (?, ?, ?, 'inbound', ?, ?, 'pending', NULL, NULL, ?)
  `);

  const insertOutbound = db.prepare(`
    INSERT INTO messages (
      id, ig_message_id, conversation_id, direction, text, ig_timestamp,
      status, error_message, agent_reply_not_before, created_at
    ) VALUES (?, ?, ?, 'outbound', ?, ?, ?, NULL, NULL, ?)
  `);

  const markRepliedStmt = db.prepare(`
    UPDATE messages SET status = 'replied', error_message = NULL WHERE id = ?
  `);

  const markSkippedStmt = db.prepare(`
    UPDATE messages SET status = 'skipped', error_message = ? WHERE id = ?
  `);

  const markFailedStmt = db.prepare(`
    UPDATE messages SET status = 'failed', error_message = ? WHERE id = ?
  `);

  const markPendingStmt = db.prepare(`
    UPDATE messages SET status = 'pending', error_message = NULL WHERE id = ?
  `);

  const scheduleAgentReplyStmt = db.prepare(`
    UPDATE messages
    SET agent_reply_not_before = ?
    WHERE id = ?
      AND status = 'pending'
      AND agent_reply_not_before IS NULL
  `);

  const countPendingStmt = db.prepare(`
    SELECT COUNT(*) AS c FROM messages
    WHERE conversation_id = ? AND status = 'pending' AND direction = 'inbound'
  `);

  const listPendingForAgentReplyStmt = db.prepare(`
    SELECT m.*, c.reply_mode AS conversation_reply_mode
    FROM messages m
    INNER JOIN conversations c ON c.id = m.conversation_id
    LEFT JOIN app_settings s ON s.id = 'primary'
    WHERE m.status = 'pending'
      AND m.direction = 'inbound'
      AND (
        CASE
          WHEN c.reply_mode = 'inherit' THEN COALESCE(s.message_reply_mode, 'draft')
          ELSE c.reply_mode
        END
      ) IN ('auto', 'draft')
      AND NOT EXISTS (
        SELECT 1 FROM message_replies mr WHERE mr.message_id = m.id
      )
      AND m.agent_reply_not_before IS NOT NULL
      AND datetime(m.agent_reply_not_before) <= datetime('now')
    ORDER BY datetime(COALESCE(m.ig_timestamp, m.created_at)) ASC
  `);

  function nowIso(): string {
    return new Date().toISOString();
  }

  return {
    findById(id: string) {
      const row = selectById.get(id);
      return row ? mapMessageRow(row as never) : null;
    },

    findByIgMessageId(igMessageId: string) {
      const row = selectByIgMessageId.get(igMessageId);
      return row ? mapMessageRow(row as never) : null;
    },

    listByConversationId(conversationId: string) {
      const rows = listByConversation.all(conversationId) as never[];
      return rows.map(mapMessageRow);
    },

    upsertInbound(input: UpsertInboundMessageInput) {
      const existing = selectByIgMessageId.get(input.igMessageId);
      if (existing) {
        return {
          message: mapMessageRow(existing as never),
          created: false,
        };
      }

      const id = randomUUID();
      const createdAt = nowIso();
      insertInbound.run(
        id,
        input.igMessageId,
        input.conversationId,
        input.text,
        input.igTimestamp,
        createdAt,
      );
      const row = selectById.get(id);
      return {
        message: mapMessageRow(row as never),
        created: true,
      };
    },

    upsertOutbound(input: UpsertOutboundMessageInput) {
      const existing = selectByIgMessageId.get(input.igMessageId);
      if (existing) {
        return mapMessageRow(existing as never);
      }

      const id = randomUUID();
      const createdAt = nowIso();
      insertOutbound.run(
        id,
        input.igMessageId,
        input.conversationId,
        input.text,
        input.igTimestamp ?? createdAt,
        input.status ?? "replied",
        createdAt,
      );
      const row = selectById.get(id);
      return mapMessageRow(row as never);
    },

    markReplied(messageId: string) {
      markRepliedStmt.run(messageId);
      const row = selectById.get(messageId);
      return row ? mapMessageRow(row as never) : null;
    },

    markSkipped(messageId: string, reason: string | null = null) {
      markSkippedStmt.run(reason, messageId);
      const row = selectById.get(messageId);
      return row ? mapMessageRow(row as never) : null;
    },

    markFailed(messageId: string, errorMessage: string) {
      markFailedStmt.run(errorMessage, messageId);
      const row = selectById.get(messageId);
      return row ? mapMessageRow(row as never) : null;
    },

    markPending(messageId: string) {
      markPendingStmt.run(messageId);
      const row = selectById.get(messageId);
      return row ? mapMessageRow(row as never) : null;
    },

    scheduleAgentReply(messageId: string, notBeforeIso: string) {
      const result = scheduleAgentReplyStmt.run(notBeforeIso, messageId);
      return result.changes > 0;
    },

    countPendingByConversation(conversationId: string) {
      const row = countPendingStmt.get(conversationId) as { c: number };
      return row?.c ?? 0;
    },

    listPendingForAgentReply() {
      const rows = listPendingForAgentReplyStmt.all() as Array<
        Record<string, unknown> & { conversation_reply_mode: string }
      >;
      return rows.map((row) => {
        const message = mapMessageRow(row as never);
        return {
          ...message,
          conversationReplyMode: String(row.conversation_reply_mode),
        } satisfies PendingAgentReplyMessage;
      });
    },
  };
}

export function createSqliteMessageReplyRepository(
  db: DatabaseSync,
): MessageReplyRepository {
  const findLatestDraftStmt = db.prepare(`
    SELECT * FROM message_replies
    WHERE message_id = ? AND status = 'draft'
    ORDER BY rowid DESC
    LIMIT 1
  `);

  const insertReply = db.prepare(`
    INSERT INTO message_replies (
      id, message_id, draft_text, sent_text, status, agent_run_id, source_ig_message_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDraft = db.prepare(`
    INSERT INTO message_replies (
      id, message_id, draft_text, sent_text, status, agent_run_id, source_ig_message_id, created_at
    ) VALUES (?, ?, ?, NULL, 'draft', ?, NULL, ?)
  `);

  const updateDraft = db.prepare(`
    UPDATE message_replies
    SET draft_text = ?, agent_run_id = COALESCE(?, agent_run_id)
    WHERE message_id = ? AND status = 'draft'
  `);

  const deleteDrafts = db.prepare(`
    DELETE FROM message_replies WHERE message_id = ? AND status = 'draft'
  `);

  const markSentStmt = db.prepare(`
    UPDATE message_replies
    SET status = 'sent', sent_text = ?, draft_text = NULL, source_ig_message_id = ?
    WHERE message_id = ? AND status = 'draft'
  `);

  const hasReplyStmt = db.prepare(`
    SELECT 1 FROM message_replies WHERE message_id = ? LIMIT 1
  `);

  const findLatestSentReplyStmt = db.prepare(`
    SELECT * FROM message_replies
    WHERE message_id = ? AND status = 'sent' AND sent_text IS NOT NULL
    ORDER BY rowid DESC
    LIMIT 1
  `);

  const conversationPendingCountSql = `(
    SELECT COUNT(*)
    FROM messages pm
    WHERE pm.conversation_id = c.id
      AND pm.status = 'pending'
      AND pm.direction = 'inbound'
  )`;

  const listPendingApprovalActivityStmt = db.prepare(`
    SELECT
      m.id AS message_id,
      m.conversation_id AS conversation_id,
      c.participant_username AS participant_username,
      m.text AS text,
      m.status AS message_status,
      COALESCE(m.ig_timestamp, m.created_at) AS occurred_at,
      mr.draft_text AS draft_text,
      NULL AS sent_text,
      ${conversationPendingCountSql} AS conversation_pending_count
    FROM messages m
    INNER JOIN message_replies mr ON mr.message_id = m.id AND mr.status = 'draft'
    INNER JOIN conversations c ON c.id = m.conversation_id
    WHERE m.status = 'pending'
      AND m.direction = 'inbound'
      AND mr.draft_text IS NOT NULL
    ORDER BY mr.rowid DESC
    LIMIT ?
  `);

  const listRecentActivityStmt = db.prepare(`
    SELECT
      m.id AS message_id,
      m.conversation_id AS conversation_id,
      c.participant_username AS participant_username,
      m.text AS text,
      m.status AS message_status,
      COALESCE(m.ig_timestamp, m.created_at) AS occurred_at,
      NULL AS draft_text,
      mr.sent_text AS sent_text,
      ${conversationPendingCountSql} AS conversation_pending_count
    FROM message_replies mr
    INNER JOIN messages m ON m.id = mr.message_id
    INNER JOIN conversations c ON c.id = m.conversation_id
    WHERE mr.status = 'sent'
      AND mr.sent_text IS NOT NULL
    ORDER BY mr.rowid DESC
    LIMIT ?
  `);

  type ActivityRowRecord = {
    message_id: string;
    conversation_id: string;
    participant_username: string | null;
    text: string | null;
    message_status: string;
    occurred_at: string;
    draft_text: string | null;
    sent_text: string | null;
    conversation_pending_count: number;
  };

  function mapActivityRow(row: ActivityRowRecord): MessageActivityRow {
    return {
      messageId: row.message_id,
      conversationId: row.conversation_id,
      participantUsername: row.participant_username,
      text: row.text,
      messageStatus: row.message_status,
      occurredAt: row.occurred_at,
      draftText: row.draft_text,
      sentText: row.sent_text,
      conversationPendingCount: Number(row.conversation_pending_count ?? 0),
    };
  }

  function nowIso(): string {
    return new Date().toISOString();
  }

  return {
    findLatestDraft(messageId: string) {
      const row = findLatestDraftStmt.get(messageId);
      return row ? mapMessageReplyRow(row as never) : null;
    },

    findLatestSentReply(messageId: string) {
      const row = findLatestSentReplyStmt.get(messageId);
      return row ? mapMessageReplyRow(row as never) : null;
    },

    upsertDraft(input: UpsertMessageDraftInput) {
      const existing = findLatestDraftStmt.get(input.messageId);
      if (existing) {
        updateDraft.run(input.draftText, input.agentRunId ?? null, input.messageId);
        const row = findLatestDraftStmt.get(input.messageId);
        return mapMessageReplyRow(row as never);
      }

      const id = randomUUID();
      insertDraft.run(
        id,
        input.messageId,
        input.draftText,
        input.agentRunId ?? null,
        nowIso(),
      );
      const row = findLatestDraftStmt.get(input.messageId);
      return mapMessageReplyRow(row as never);
    },

    createReply(input: CreateMessageReplyInput) {
      const id = randomUUID();
      const createdAt = nowIso();
      insertReply.run(
        id,
        input.messageId,
        input.draftText ?? null,
        input.sentText ?? null,
        input.status,
        input.agentRunId ?? null,
        input.sourceIgMessageId ?? null,
        createdAt,
      );
      return {
        id,
        messageId: input.messageId,
        draftText: input.draftText ?? null,
        sentText: input.sentText ?? null,
        status: input.status,
        agentRunId: input.agentRunId ?? null,
        sourceIgMessageId: input.sourceIgMessageId ?? null,
        createdAt,
      };
    },

    promoteDraftToSent(messageId: string, sentText: string, sourceIgMessageId: string | null) {
      const result = markSentStmt.run(sentText, sourceIgMessageId, messageId);
      return result.changes > 0;
    },

    clearDraft(messageId: string) {
      const result = deleteDrafts.run(messageId);
      return result.changes > 0;
    },

    markSent(messageId: string, sentText: string, sourceIgMessageId: string | null) {
      const result = markSentStmt.run(sentText, sourceIgMessageId, messageId);
      return result.changes > 0;
    },

    hasReplyRecord(messageId: string) {
      return Boolean(hasReplyStmt.get(messageId));
    },

    listActivityRows(kind: MessageActivityKind, limit: number) {
      if (kind === "pending_approval") {
        return listPendingApprovalActivityStmt
          .all(limit)
          .map((row) => mapActivityRow(row as ActivityRowRecord));
      }
      return listRecentActivityStmt
        .all(limit)
        .map((row) => mapActivityRow(row as ActivityRowRecord));
    },
  };
}
