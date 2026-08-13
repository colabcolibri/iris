import type { AppContext } from "../api/app-context.ts";
import type { LlmCompleter } from "../ports/llm-completer.ts";
import type { MetaMessageSender } from "../ports/meta-message-sender.ts";
import { getAppSettingsOrDefault } from "../adapters/sqlite/app-settings-repository.ts";
import { resolveCommentResponderIntervalMs } from "../domain/comments/resolve-comment-responder-interval.ts";
import { processMessageReply } from "../domain/messages/process-message-reply.ts";

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

  const appSettings = getAppSettingsOrDefault(ctx.appSettingsStore);
  const intervalMs =
    options.intervalMs ??
    resolveCommentResponderIntervalMs(appSettings.messageReplyDelaySeconds);
  let running = false;

  const tick = async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const pending = ctx.messages.listPendingForAgentReply();

      for (const message of pending) {
        await processMessageReply(ctx, message.id, {
          trigger: "worker",
          llmCompleter: llm,
          metaMessageSender: sender,
        });
      }
    } catch (error) {
      options.onTickError?.(error);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => {
    void tick();
  }, intervalMs);

  void tick();

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return () => {
    clearInterval(timer);
  };
}
