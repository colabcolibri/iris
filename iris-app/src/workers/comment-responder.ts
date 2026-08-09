import type { AppContext } from "../api/app-context.ts";
import type { MetaCommentReplier } from "../ports/meta-comment-replier.ts";
import type { LlmCompleter } from "../ports/llm-completer.ts";
import { generateReply } from "../agents/reply-agent.ts";
import { notifyCommentsChanged } from "../adapters/sse/event-bus.ts";

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
  const llm = options.llmCompleter ?? ctx.llmCompleter;

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
      const pending = ctx.comments.listPendingForAutoReply();

      for (const comment of pending) {
        const inputSummary = `@${comment.authorUsername ?? "user"}: ${(comment.text ?? "").slice(0, 120)}`;

        try {
          const message = await generateReply({ llm }, {
            caption: comment.postCaption,
            commentText: comment.text,
            authorUsername: comment.authorUsername,
          });

          await replier.reply(comment.igCommentId, message);

          const run = ctx.agentRuns.create({
            trigger: "worker",
            inputSummary,
            outputSummary: message.slice(0, 500),
            status: "ok",
          });

          ctx.comments.createReply(comment.id, message, "sent", run.id);
          ctx.comments.markReplied(comment.id);
          notifyCommentsChanged({ post_id: comment.postId });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message.slice(0, 500) : "reply failed";

          const run = ctx.agentRuns.create({
            trigger: "worker",
            inputSummary,
            outputSummary: errorMessage,
            status: "failed",
          });

          ctx.comments.createReply(comment.id, "", "failed", run.id);
          ctx.comments.markFailed(comment.id, errorMessage);
          notifyCommentsChanged({ post_id: comment.postId });
        }
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

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return () => {
    clearInterval(timer);
  };
}
