import type { MessageRepository } from "../../ports/message-repository.ts";
import { messageImportCutoffIso } from "./message-sync-window.ts";

export type PurgeMessageHistoryDeps = {
  messages: MessageRepository;
};

export type PurgeMessageHistoryResult = {
  cutoff: string;
  messagesDeleted: number;
  conversationsDeleted: number;
};

export function purgeMessageHistory(
  deps: PurgeMessageHistoryDeps,
  now = Date.now(),
): PurgeMessageHistoryResult {
  const cutoff = messageImportCutoffIso(now);
  const result = deps.messages.purgeOlderThan(cutoff);
  return { cutoff, ...result };
}
