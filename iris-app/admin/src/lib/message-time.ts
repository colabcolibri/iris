import { formatDateTime } from "@/i18n/formatting";
import type { AppLocale } from "@/i18n/types";
import type { Message } from "@/lib/types";

function parseTimestampMs(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const normalized = trimmed.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const ms = Date.parse(normalized);
  return Number.isNaN(ms) ? 0 : ms;
}

export function messageTimestamp(
  message: Pick<Message, "created_at" | "ig_timestamp">,
): string {
  return message.ig_timestamp ?? message.created_at;
}

export function formatMessageDateTime(
  message: Pick<Message, "created_at" | "ig_timestamp">,
  locale: AppLocale,
): string {
  const ms = parseTimestampMs(messageTimestamp(message));
  if (!ms) {
    return messageTimestamp(message);
  }

  return formatDateTime(ms, locale);
}
