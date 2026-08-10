import type { AppContext } from "../api/app-context.ts";
import type { MetaCommentReplier } from "../ports/meta-comment-replier.ts";
import type { LlmCompleter } from "../ports/llm-completer.ts";
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

  const intervalMs =
    options.intervalMs ?? Number(process.env.IRIS_REPLY_TICK_MS ?? 60_000);
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
