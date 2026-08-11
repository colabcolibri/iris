import { parseCommentEntries } from "./meta-webhook.ts";

export type WebhookEventSummary = {
  webhook_type: string;
  verb: string | null;
  ig_comment_id: string | null;
  ig_media_id: string | null;
  author_username: string | null;
  text_preview: string | null;
  entries_count: number;
};

const FIELD_LABELS: Record<string, string> = {
  comments: "Comentário",
  mentions: "Menção",
  story_insights: "Insights de story",
  live_comments: "Comentário ao vivo",
};

function readVerb(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = payload as Record<string, unknown>;
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

      const value = (change as { value?: unknown }).value;
      if (!value || typeof value !== "object") {
        continue;
      }

      const verb = (value as Record<string, unknown>).verb;
      if (typeof verb === "string" && verb.trim()) {
        return verb.trim();
      }
    }
  }

  return null;
}

export function formatWebhookType(object: string | null, field: string | null): string {
  const objectLabel =
    object === "instagram"
      ? "Instagram"
      : object === "page"
        ? "Página Facebook"
        : object ?? "Desconhecido";

  if (!field) {
    return objectLabel;
  }

  const fieldLabel = FIELD_LABELS[field] ?? field;
  return `${objectLabel} · ${fieldLabel}`;
}

export function summarizeWebhookPayload(
  payloadJson: string,
  object: string | null,
  field: string | null,
): WebhookEventSummary {
  let payload: unknown = null;

  try {
    payload = JSON.parse(payloadJson) as unknown;
  } catch {
    return {
      webhook_type: formatWebhookType(object, field),
      verb: null,
      ig_comment_id: null,
      ig_media_id: null,
      author_username: null,
      text_preview: null,
      entries_count: 0,
    };
  }

  const entries = parseCommentEntries(payload);
  const first = entries[0] ?? null;
  const text = first?.text?.trim() ?? null;

  return {
    webhook_type: formatWebhookType(object, field),
    verb: readVerb(payload),
    ig_comment_id: first?.igCommentId ?? null,
    ig_media_id: first?.igMediaId ?? null,
    author_username: first?.authorUsername ?? null,
    text_preview: text && text.length > 140 ? `${text.slice(0, 139)}…` : text,
    entries_count: entries.length,
  };
}
