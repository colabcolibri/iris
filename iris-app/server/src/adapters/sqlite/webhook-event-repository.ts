import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  InsertWebhookEventInput,
  UpdateWebhookEventInput,
  WebhookEventListFilter,
  WebhookEventRecord,
  WebhookEventRepository,
  WebhookProcessingStatus,
} from "../../ports/webhook-event-repository.ts";

function mapRow(row: {
  id: string;
  received_at: string;
  signature_valid: number;
  object: string | null;
  field: string | null;
  payload_json: string;
  processing_status: string;
  comment_id: string | null;
  post_id: string | null;
  conversation_id: string | null;
  message_id: string | null;
  error_message: string | null;
}): WebhookEventRecord {
  return {
    id: row.id,
    receivedAt: row.received_at,
    signatureValid: row.signature_valid === 1,
    object: row.object,
    field: row.field,
    payloadJson: row.payload_json,
    processingStatus: row.processing_status as WebhookProcessingStatus,
    commentId: row.comment_id,
    postId: row.post_id,
    conversationId: row.conversation_id,
    messageId: row.message_id,
    errorMessage: row.error_message,
  };
}

export function createSqliteWebhookEventRepository(
  db: DatabaseSync,
): WebhookEventRepository {
  const insertStmt = db.prepare(`
    INSERT INTO meta_webhook_events (
      id, received_at, signature_valid, object, field, payload_json,
      processing_status, comment_id, post_id, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)
  `);

  const updateStmt = db.prepare(`
    UPDATE meta_webhook_events
    SET processing_status = COALESCE(?, processing_status),
        object = COALESCE(?, object),
        field = COALESCE(?, field),
        comment_id = COALESCE(?, comment_id),
        post_id = COALESCE(?, post_id),
        conversation_id = COALESCE(?, conversation_id),
        message_id = COALESCE(?, message_id),
        error_message = COALESCE(?, error_message)
    WHERE id = ?
  `);

  const selectById = db.prepare(`
    SELECT * FROM meta_webhook_events WHERE id = ?
  `);

  function listWithFilter(limit: number, filter?: WebhookEventListFilter) {
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (filter?.status) {
      clauses.push("processing_status = ?");
      params.push(filter.status);
    }

    if (filter?.field) {
      clauses.push("field = ?");
      params.push(filter.field);
    }

    if (filter?.signatureValid === false) {
      clauses.push("signature_valid = 0");
    } else if (filter?.signatureValid === true) {
      clauses.push("signature_valid = 1");
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = db
      .prepare(
        `SELECT * FROM meta_webhook_events ${where} ORDER BY datetime(received_at) DESC LIMIT ?`,
      )
      .all(...params, limit);

    return rows.map((row) => mapRow(row as never));
  }

  const countStmt = db.prepare(`
    SELECT COUNT(*) AS total FROM meta_webhook_events
  `);

  const deleteOlderThanStmt = db.prepare(`
    DELETE FROM meta_webhook_events
    WHERE datetime(received_at) < datetime(?)
  `);

  return {
    insert(input: InsertWebhookEventInput) {
      const id = randomUUID();
      const receivedAt = new Date().toISOString();
      const processingStatus = input.processingStatus ?? "received";

      insertStmt.run(
        id,
        receivedAt,
        input.signatureValid ? 1 : 0,
        input.object ?? null,
        input.field ?? null,
        input.payloadJson,
        processingStatus,
        input.errorMessage ?? null,
      );

      return mapRow(selectById.get(id) as never);
    },

    update(id: string, input: UpdateWebhookEventInput) {
      updateStmt.run(
        input.processingStatus ?? null,
        input.object ?? null,
        input.field ?? null,
        input.commentId ?? null,
        input.postId ?? null,
        input.conversationId ?? null,
        input.messageId ?? null,
        input.errorMessage ?? null,
        id,
      );

      const row = selectById.get(id) as never | undefined;
      return row ? mapRow(row) : null;
    },

    listRecent(limit: number, filter?: WebhookEventListFilter) {
      return listWithFilter(limit, filter);
    },

    listForExport(limit: number, filter?: WebhookEventListFilter) {
      return listWithFilter(limit, filter);
    },

    count() {
      const row = countStmt.get() as { total: number };
      return row.total;
    },

    deleteOlderThan(cutoffIso: string) {
      const result = deleteOlderThanStmt.run(cutoffIso);
      return result.changes ?? 0;
    },
  };
}
