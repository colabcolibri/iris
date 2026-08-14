import type { MessageStageResult } from "../message-harness/types.ts";
import type { OperatorNotificationLogEntry } from "./operator-notification-types.ts";

export type OperatorNotificationLogApi = {
  id: string;
  event_type: string;
  channel: string;
  status: "sent" | "skipped" | "failed";
  payload_summary: string;
  recipient: string | null;
  error_message: string | null;
  created_at: string;
};

export function serializeOperatorNotificationLogEntry(
  entry: OperatorNotificationLogEntry,
): OperatorNotificationLogApi {
  return {
    id: entry.id,
    event_type: entry.eventType,
    channel: entry.channel,
    status: entry.status,
    payload_summary: entry.payloadSummary,
    recipient: entry.recipient,
    error_message: entry.errorMessage,
    created_at: entry.createdAt,
  };
}

export function collectOperatorNotificationsFromHarnessSteps(
  steps: MessageStageResult[],
): OperatorNotificationLogApi[] {
  const results: OperatorNotificationLogApi[] = [];

  for (const step of steps) {
    const structured = step.structured as Record<string, unknown> | undefined;
    if (structured?.toolName !== "notify_operator") {
      continue;
    }

    const toolOutput = structured.toolOutput as Record<string, unknown> | undefined;
    const notifications = toolOutput?.notifications;
    if (!Array.isArray(notifications)) {
      continue;
    }

    for (const item of notifications) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const row = item as Partial<OperatorNotificationLogApi>;
      if (
        typeof row.id === "string" &&
        typeof row.status === "string" &&
        typeof row.channel === "string"
      ) {
        results.push(row as OperatorNotificationLogApi);
      }
    }
  }

  return results;
}
