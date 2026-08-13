import { createHmac, timingSafeEqual } from "node:crypto";
import { normalizeCommentTimestamp } from "../comments/normalize-comment-timestamp.ts";
import {
  isMessageFromOwner,
  type MessageOwnerContext,
} from "../messages/is-message-from-owner.ts";

export type { MessageOwnerContext };

export type ParsedCommentEntry = {
  igCommentId: string;
  igMediaId: string;
  parentIgCommentId: string | null;
  text: string | null;
  authorUsername: string | null;
  igTimestamp: string | null;
};

export type ParsedMessageEntry = {
  igMessageId: string;
  senderIgUserId: string;
  recipientIgUserId: string;
  senderUsername: string | null;
  senderDisplayName: string | null;
  text: string | null;
  igTimestamp: string | null;
  direction: "inbound" | "outbound";
  attachmentUrl: string | null;
  attachmentMediaType: "image" | "video" | "file" | null;
};

export function verifySubscribeToken(
  provided: string | null,
  expected: string,
): boolean {
  if (!provided || !expected) {
    return false;
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

export function verifyHubSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader || !appSecret) {
    return false;
  }

  const [algorithm, digest] = signatureHeader.split("=");
  if (algorithm !== "sha256" || !digest) {
    return false;
  }

  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const actual = Buffer.from(digest);
  const reference = Buffer.from(expected);

  if (actual.length !== reference.length) {
    return false;
  }

  return timingSafeEqual(actual, reference);
}

function readMediaId(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.id === "string") {
    return record.id;
  }

  if (typeof record.media_id === "string") {
    return record.media_id;
  }

  return null;
}

function readSenderUsername(sender: Record<string, unknown> | null): string | null {
  if (!sender) {
    return null;
  }
  return typeof sender.username === "string" ? sender.username : null;
}

function readSenderDisplayName(sender: Record<string, unknown> | null): string | null {
  if (!sender) {
    return null;
  }
  return typeof sender.name === "string" ? sender.name : null;
}

function readMessageAttachment(message: Record<string, unknown>): {
  attachmentUrl: string | null;
  attachmentMediaType: "image" | "video" | "file" | null;
} {
  const attachments = Array.isArray(message.attachments) ? message.attachments : [];
  for (const item of attachments) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    const payload =
      record.payload && typeof record.payload === "object"
        ? (record.payload as Record<string, unknown>)
        : null;
    const url =
      (payload && typeof payload.url === "string" ? payload.url : null) ??
      (typeof record.url === "string" ? record.url : null);
    if (!url) {
      continue;
    }
    const type = typeof record.type === "string" ? record.type.toLowerCase() : "";
    if (type.includes("image")) {
      return { attachmentUrl: url, attachmentMediaType: "image" };
    }
    if (type.includes("video")) {
      return { attachmentUrl: url, attachmentMediaType: "video" };
    }
    return { attachmentUrl: url, attachmentMediaType: "file" };
  }
  return { attachmentUrl: null, attachmentMediaType: null };
}

function readCommentTimestamp(record: Record<string, unknown>): string | null {
  const candidates = [record.timestamp, record.created_time, record.created_at];

  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const normalized = normalizeCommentTimestamp(candidate);
      if (normalized) {
        return normalized;
      }
    }

    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      const normalized = normalizeCommentTimestamp(new Date(candidate * 1000).toISOString());
      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
}

export function parseCommentEntries(payload: unknown): ParsedCommentEntry[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const root = payload as Record<string, unknown>;
  const entries = Array.isArray(root.entry) ? root.entry : [];
  const parsed: ParsedCommentEntry[] = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const changes = Array.isArray((entry as { changes?: unknown }).changes)
      ? (entry as { changes: unknown[] }).changes
      : [];

    for (const change of changes) {
      if (!change || typeof change !== "object") {
        continue;
      }

      const field = (change as { field?: unknown }).field;
      if (field !== "comments") {
        continue;
      }

      const value = (change as { value?: unknown }).value;
      if (!value || typeof value !== "object") {
        continue;
      }

      const record = value as Record<string, unknown>;
      const igCommentId =
        typeof record.id === "string"
          ? record.id
          : typeof record.comment_id === "string"
            ? record.comment_id
            : null;

      const igMediaId = readMediaId(record.media) ?? readMediaId(record);

      if (!igCommentId || !igMediaId) {
        continue;
      }

      const from =
        record.from && typeof record.from === "object"
          ? (record.from as Record<string, unknown>)
          : null;

      const parentRaw =
        record.parent_id ??
        record.parent_comment_id ??
        (record.parent &&
        typeof record.parent === "object" &&
        typeof (record.parent as Record<string, unknown>).id === "string"
          ? (record.parent as Record<string, unknown>).id
          : null);

      parsed.push({
        igCommentId,
        igMediaId,
        parentIgCommentId:
          typeof parentRaw === "string" && parentRaw.trim() ? parentRaw : null,
        text: typeof record.text === "string" ? record.text : null,
        authorUsername:
          from && typeof from.username === "string" ? from.username : null,
        igTimestamp: readCommentTimestamp(record),
      });
    }
  }

  return parsed;
}

function readMessageTimestamp(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return normalizeCommentTimestamp(new Date(value).toISOString());
  }

  if (typeof value === "string") {
    return normalizeCommentTimestamp(value);
  }

  return null;
}

function parseMessagingArray(
  messaging: unknown[],
  owner: MessageOwnerContext | null,
  entryIgUserId: string | null,
): ParsedMessageEntry[] {
  const parsed: ParsedMessageEntry[] = [];

  for (const item of messaging) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    const message =
      record.message && typeof record.message === "object"
        ? (record.message as Record<string, unknown>)
        : null;

    if (!message) {
      continue;
    }

    const igMessageId =
      typeof message.mid === "string"
        ? message.mid
        : typeof message.id === "string"
          ? message.id
          : null;

    const sender =
      record.sender && typeof record.sender === "object"
        ? (record.sender as Record<string, unknown>)
        : null;
    const recipient =
      record.recipient && typeof record.recipient === "object"
        ? (record.recipient as Record<string, unknown>)
        : null;

    const senderIgUserId = sender && typeof sender.id === "string" ? sender.id : null;
    const recipientIgUserId =
      recipient && typeof recipient.id === "string" ? recipient.id : null;

    if (!igMessageId || !senderIgUserId || !recipientIgUserId) {
      continue;
    }

    const direction = isMessageFromOwner(
      senderIgUserId,
      readSenderUsername(sender),
      owner ?? { igUserId: null, igUsername: null },
      entryIgUserId ? [entryIgUserId] : [],
    )
      ? "outbound"
      : "inbound";
    const attachment = readMessageAttachment(message);

    parsed.push({
      igMessageId,
      senderIgUserId,
      recipientIgUserId,
      senderUsername: readSenderUsername(sender),
      senderDisplayName: readSenderDisplayName(sender),
      text: typeof message.text === "string" ? message.text : null,
      igTimestamp: readMessageTimestamp(record.timestamp),
      direction,
      attachmentUrl: attachment.attachmentUrl,
      attachmentMediaType: attachment.attachmentMediaType,
    });
  }

  return parsed;
}

export function parseMessageEntries(
  payload: unknown,
  owner: MessageOwnerContext | null = null,
): ParsedMessageEntry[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const root = payload as Record<string, unknown>;
  const entries = Array.isArray(root.entry) ? root.entry : [];
  const parsed: ParsedMessageEntry[] = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const entryRecord = entry as Record<string, unknown>;
    const entryIgUserId =
      typeof entryRecord.id === "string" ? entryRecord.id : null;
    const messaging = Array.isArray(entryRecord.messaging)
      ? entryRecord.messaging
      : [];

    if (messaging.length > 0) {
      parsed.push(...parseMessagingArray(messaging, owner, entryIgUserId));
      continue;
    }

    const changes = Array.isArray(entryRecord.changes) ? entryRecord.changes : [];

    for (const change of changes) {
      if (!change || typeof change !== "object") {
        continue;
      }

      const field = (change as { field?: unknown }).field;
      if (field !== "messages") {
        continue;
      }

      const value = (change as { value?: unknown }).value;
      if (!value || typeof value !== "object") {
        continue;
      }

      const record = value as Record<string, unknown>;
      const igMessageId =
        typeof record.id === "string"
          ? record.id
          : typeof record.message_id === "string"
            ? record.message_id
            : null;

      const sender =
        record.from && typeof record.from === "object"
          ? (record.from as Record<string, unknown>)
          : null;
      const senderIgUserId = sender && typeof sender.id === "string" ? sender.id : null;

      if (!igMessageId || !senderIgUserId) {
        continue;
      }

      const senderUsername =
        sender && typeof sender.username === "string" ? sender.username : null;
      const direction = isMessageFromOwner(
        senderIgUserId,
        senderUsername,
        owner ?? { igUserId: null, igUsername: null },
        entryIgUserId ? [entryIgUserId] : [],
      )
        ? "outbound"
        : "inbound";
      const attachment = readMessageAttachment(record);

      parsed.push({
        igMessageId,
        senderIgUserId,
        recipientIgUserId: entryIgUserId ?? owner?.igUserId ?? "unknown",
        senderUsername,
        senderDisplayName:
          sender && typeof sender.name === "string" ? sender.name : null,
        text: typeof record.text === "string" ? record.text : null,
        igTimestamp: readMessageTimestamp(record.timestamp ?? record.created_time),
        direction,
        attachmentUrl: attachment.attachmentUrl,
        attachmentMediaType: attachment.attachmentMediaType,
      });
    }
  }

  return parsed;
}

export function readWebhookEnvelope(payload: unknown): {
  object: string | null;
  field: string | null;
} {
  if (!payload || typeof payload !== "object") {
    return { object: null, field: null };
  }

  const root = payload as Record<string, unknown>;
  const object = typeof root.object === "string" ? root.object : null;
  const entries = Array.isArray(root.entry) ? root.entry : [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const changes = Array.isArray((entry as { changes?: unknown }).changes)
      ? (entry as { changes: unknown[] }).changes
      : [];

    for (const change of changes) {
      if (!change || typeof change !== "object") {
        continue;
      }

      const field = (change as { field?: unknown }).field;
      if (typeof field === "string") {
        return { object, field };
      }
    }
  }

  return { object, field: null };
}
