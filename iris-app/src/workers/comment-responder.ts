import type { AppContext } from "../api/app-context.ts";
import type { MetaCommentReplier } from "../ports/meta-comment-replier.ts";
import type { LlmCompleter } from "../ports/llm-completer.ts";
import { getAppSettingsOrDefault } from "../adapters/sqlite/app-settings-repository.ts";
import { resolveCommentResponderIntervalMs } from "../domain/comments/resolve-comment-responder-interval.ts";
import { processCommentReply } from "../domain/comments/process-comment-reply.ts";

export type CommentResponderOptions = {
  intervalMs?: number;
  metaCommentReplier?: MetaCommentReplier;
  llmCompleter?: LlmCompleter;
  onTickError?: (error: unknown) => void;
};

export function startCommentResponder(
  ctx: AppContext,
  options: CommentResponderOptions = {},
): () => void {
  const replier = options.metaCommentReplier ?? ctx.metaCommentReplier;
  const llm = options.llmCompleter ?? ctx.resolveLlmCompleter();

  if (!replier || !llm) {
    return () => undefined;
  }

  const appSettings = getAppSettingsOrDefault(ctx.appSettingsStore);
  const intervalMs =
    options.intervalMs ??
    resolveCommentResponderIntervalMs(appSettings.replyDelaySeconds);
  let running = false;

  const tick = async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const pending = ctx.comments.listPendingForAgentReply();

      for (const comment of pending) {
        await processCommentReply(ctx, comment.id, {
          trigger: "worker",
          llmCompleter: llm,
          metaCommentReplier: replier,
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
