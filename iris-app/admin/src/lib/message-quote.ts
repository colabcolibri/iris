import type { Message } from "@/lib/types";
import { participantDisplayLabel } from "@/lib/participant-display";

export function resolveQuotedMessageByIgId(
  replyToIgMessageId: string | null | undefined,
  messages: Message[],
): Message | null {
  if (!replyToIgMessageId) {
    return null;
  }
  return messages.find((item) => item.ig_message_id === replyToIgMessageId) ?? null;
}

export function quotedMessagePreview(
  message: Message | null,
  participantUsername?: string | null,
  participantDisplayName?: string | null,
  brandUsername?: string | null,
): string | null {
  if (!message) {
    return null;
  }
  const text = message.text?.trim();
  if (text) {
    return text;
  }
  if (message.attachment_url) {
    return "(anexo)";
  }
  const author = participantDisplayLabel(
    message.direction === "inbound" ? participantUsername : brandUsername,
    message.direction === "inbound" ? participantDisplayName : null,
  );
  return `${author}: (sem texto)`;
}
