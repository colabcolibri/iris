import type { AppContext } from "../api/app-context.ts";
import type { MetaCommentReplier } from "../ports/meta-comment-replier.ts";
import type { LlmCompleter } from "../ports/llm-completer.ts";
import { getAppSettingsOrDefault } from "../adapters/sqlite/app-settings-repository.ts";
import { resolveAgentReplyTickIntervalMs } from "../domain/settings/resolve-agent-reply-tick-interval.ts";
import { pickLatestPendingCommentPerAuthorOnPost } from "../domain/agent-reply/agent-reply-debounce.ts";
import { enqueueSchedulablePendingComments } from "../domain/comments/enqueue-schedulable-pending-comments.ts";
import { processCommentReply } from "../domain/comments/process-comment-reply.ts";
import { startSettingsPolledWorker } from "./start-settings-polled-worker.ts";

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

  return startSettingsPolledWorker({
    intervalMs: options.intervalMs,
    resolveIntervalMs: () =>
      resolveAgentReplyTickIntervalMs(getAppSettingsOrDefault(ctx.appSettingsStore)),
    onTickError: options.onTickError,
    tick: async () => {
      enqueueSchedulablePendingComments(ctx);

      const pending = pickLatestPendingCommentPerAuthorOnPost(
        ctx.comments.listPendingForAgentReply(),
      );

      for (const comment of pending) {
        await processCommentReply(ctx, comment.id, {
          trigger: "worker",
          llmCompleter: llm,
          metaCommentReplier: replier,
        });
      }
    },
  });
}
