import type { AppContext } from "../api/app-context.ts";
import type { LlmCompleter } from "../ports/llm-completer.ts";
import type { MetaMessageSender } from "../ports/meta-message-sender.ts";
import { getAppSettingsOrDefault } from "../adapters/sqlite/app-settings-repository.ts";
import { resolveAgentReplyTickIntervalMs } from "../domain/settings/resolve-agent-reply-tick-interval.ts";
import { processMessageReply } from "../domain/messages/process-message-reply.ts";
import { startSettingsPolledWorker } from "./start-settings-polled-worker.ts";

export type MessageResponderOptions = {
  intervalMs?: number;
  metaMessageSender?: MetaMessageSender;
  llmCompleter?: LlmCompleter;
  onTickError?: (error: unknown) => void;
};

export function startMessageResponder(
  ctx: AppContext,
  options: MessageResponderOptions = {},
): () => void {
  const sender = options.metaMessageSender ?? ctx.metaMessageSender;
  const llm = options.llmCompleter ?? ctx.resolveLlmCompleter();

  if (!sender || !llm) {
    return () => undefined;
  }

  return startSettingsPolledWorker({
    intervalMs: options.intervalMs,
    resolveIntervalMs: () =>
      resolveAgentReplyTickIntervalMs(getAppSettingsOrDefault(ctx.appSettingsStore)),
    onTickError: options.onTickError,
    tick: async () => {
      const pending = ctx.messages.listPendingForAgentReply();

      for (const message of pending) {
        await processMessageReply(ctx, message.id, {
          trigger: "worker",
          llmCompleter: llm,
          metaMessageSender: sender,
        });
      }
    },
  });
}
