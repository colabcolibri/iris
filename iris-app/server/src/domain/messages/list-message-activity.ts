import { ValidationError } from "../../api/json.ts";

export type MessageActivityKind = "pending_approval" | "recent";

export const MESSAGE_ACTIVITY_KINDS: MessageActivityKind[] = [
  "pending_approval",
  "recent",
];

export const MESSAGE_ACTIVITY_DEFAULT_LIMIT = 20;
export const MESSAGE_ACTIVITY_MAX_LIMIT = 50;

export type MessageActivityRow = {
  messageId: string;
  conversationId: string;
  participantUsername: string | null;
  text: string | null;
  messageStatus: string;
  occurredAt: string;
  draftText: string | null;
  sentText: string | null;
  conversationPendingCount: number;
};

export type MessageActivityItem = {
  messageId: string;
  conversationId: string;
  participantUsername: string | null;
  textPreview: string;
  occurredAt: string;
  conversationPendingCount: number;
  draftTextPreview: string | null;
  sentTextPreview: string | null;
};

export function parseMessageActivityKind(value: string | null | undefined): MessageActivityKind {
  const normalized = value?.trim();
  if (!normalized || !MESSAGE_ACTIVITY_KINDS.includes(normalized as MessageActivityKind)) {
    throw new ValidationError(`kind must be one of: ${MESSAGE_ACTIVITY_KINDS.join(", ")}`);
  }
  return normalized as MessageActivityKind;
}

export function clampMessageActivityLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return MESSAGE_ACTIVITY_DEFAULT_LIMIT;
  }
  return Math.min(MESSAGE_ACTIVITY_MAX_LIMIT, Math.max(1, Math.floor(value as number)));
}

function previewText(value: string | null | undefined, max = 120): string {
  const text = value?.trim();
  if (!text) {
    return "(sem texto)";
  }
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
}

export function mapMessageActivityRow(row: MessageActivityRow): MessageActivityItem {
  return {
    messageId: row.messageId,
    conversationId: row.conversationId,
    participantUsername: row.participantUsername,
    textPreview: previewText(row.text),
    occurredAt: row.occurredAt,
    conversationPendingCount: row.conversationPendingCount,
    draftTextPreview: row.draftText ? previewText(row.draftText) : null,
    sentTextPreview: row.sentText ? previewText(row.sentText) : null,
  };
}

export type ListMessageActivityInput = {
  kind: MessageActivityKind;
  limit?: number;
  listActivityRows: (kind: MessageActivityKind, limit: number) => MessageActivityRow[];
};

export function listMessageActivity(input: ListMessageActivityInput): MessageActivityItem[] {
  const limit = clampMessageActivityLimit(input.limit);
  const rows = input.listActivityRows(input.kind, limit);
  return rows.map(mapMessageActivityRow);
}
