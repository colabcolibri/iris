import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { OperatorNotificationLogRepository } from "../../domain/notifications/operator-notification-service.ts";
import type {
  OperatorNotificationLogEntry,
  OperatorNotificationLogStatus,
} from "../../domain/notifications/operator-notification-types.ts";

type LogRow = {
  id: string;
  event_type: string;
  channel: string;
  status: string;
  payload_summary: string;
  recipient: string | null;
  error_message: string | null;
  created_at: string;
};

function mapRow(row: LogRow): OperatorNotificationLogEntry {
  return {
    id: row.id,
    eventType: row.event_type as OperatorNotificationLogEntry["eventType"],
    channel: row.channel as OperatorNotificationLogEntry["channel"],
    status: row.status as OperatorNotificationLogStatus,
    payloadSummary: row.payload_summary,
    recipient: row.recipient,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

export function createSqliteOperatorNotificationLogRepository(
  db: DatabaseSync,
): OperatorNotificationLogRepository {
  const insertStmt = db.prepare(`
    INSERT INTO operator_notifications (
      id, event_type, channel, status, payload_summary, recipient, error_message, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const listStmt = db.prepare(`
    SELECT id, event_type, channel, status, payload_summary, recipient, error_message, created_at
    FROM operator_notifications
    ORDER BY created_at DESC
    LIMIT ?
  `);

  return {
    append(input) {
      const id = input.id ?? randomUUID();
      const createdAt = input.createdAt ?? new Date().toISOString();
      insertStmt.run(
        id,
        input.eventType,
        input.channel,
        input.status,
        input.payloadSummary,
        input.recipient,
        input.errorMessage,
        createdAt,
      );
      return {
        id,
        eventType: input.eventType,
        channel: input.channel,
        status: input.status,
        payloadSummary: input.payloadSummary,
        recipient: input.recipient ?? null,
        errorMessage: input.errorMessage ?? null,
        createdAt,
      };
    },
    listRecent(limit) {
      return listStmt.all(limit).map((row) => mapRow(row as LogRow));
    },
  };
}
