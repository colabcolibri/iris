import { createHmac, timingSafeEqual } from "node:crypto";

export type ParsedCommentEntry = {
  igCommentId: string;
  igMediaId: string;
  text: string | null;
  authorUsername: string | null;
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

      parsed.push({
        igCommentId,
        igMediaId,
        text: typeof record.text === "string" ? record.text : null,
        authorUsername:
          from && typeof from.username === "string" ? from.username : null,
      });
    }
  }

  return parsed;
}
