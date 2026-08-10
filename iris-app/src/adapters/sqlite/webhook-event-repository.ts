import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  InsertWebhookEventInput,
  UpdateWebhookEventInput,
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
    ) VALUES (?, ?, 1, ?, ?, ?, 'received', NULL, NULL, NULL)
  `);

  const updateStmt = db.prepare(`
    UPDATE meta_webhook_events
    SET processing_status = ?,
        comment_id = COALESCE(?, comment_id),
        post_id = COALESCE(?, post_id),
        error_message = ?
    WHERE id = ?
  `);

  const selectById = db.prepare(`
    SELECT * FROM meta_webhook_events WHERE id = ?
  `);

  const listRecentStmt = db.prepare(`
    SELECT * FROM meta_webhook_events
    ORDER BY datetime(received_at) DESC
    LIMIT ?
  `);

  const countStmt = db.prepare(`
    SELECT COUNT(*) AS total FROM meta_webhook_events
  `);

  return {
    insert(input: InsertWebhookEventInput) {
      const id = randomUUID();
      const receivedAt = new Date().toISOString();

      insertStmt.run(
        id,
        receivedAt,
        input.object,
        input.field,
        input.payloadJson,
      );

      return mapRow(selectById.get(id) as never);
    },

    update(id: string, input: UpdateWebhookEventInput) {
      updateStmt.run(
        input.processingStatus,
        input.commentId ?? null,
        input.postId ?? null,
        input.errorMessage ?? null,
        id,
      );

      const row = selectById.get(id) as never | undefined;
      return row ? mapRow(row) : null;
    },

    listRecent(limit: number) {
      return listRecentStmt.all(limit).map((row) => mapRow(row as never));
    },

    count() {
      const row = countStmt.get() as { total: number };
      return row.total;
    },
  };
}
