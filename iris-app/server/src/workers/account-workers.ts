import type { AppContext } from "../api/app-context.ts";
import { publishPostNow } from "../domain/posts/publish-post.ts";
import { isDueForPublish } from "../domain/posts/schedule.ts";
import { enqueueSchedulablePendingComments } from "../domain/comments/enqueue-schedulable-pending-comments.ts";
import { processCommentReply } from "../domain/comments/process-comment-reply.ts";
import { processCommentPrivateReply } from "../domain/comments/process-comment-private-reply.ts";
import { pickLatestPendingCommentPerAuthorOnPost } from "../domain/agent-reply/agent-reply-debounce.ts";
import { pickLatestPendingMessagePerConversation } from "../domain/agent-reply/agent-reply-debounce.ts";
import { processMessageReply } from "../domain/messages/process-message-reply.ts";

export async function runPublishTick(ctx: AppContext): Promise<void> {
  if (!ctx.metaPublisher) {
    return;
  }
  const duePosts = ctx.posts.list({ status: "scheduled" }).filter((post) => isDueForPublish(post));
  for (const post of duePosts) {
    const assets = ctx.assets.listByPostId(post.id);
    if (assets.length < 1) {
      continue;
    }
    try {
      await publishPostNow(ctx, post.id, ctx.metaPublisher);
    } catch {
      // publishPostNow already persisted the failure.
    }
  }
}

export async function runCommentResponderTick(ctx: AppContext): Promise<void> {
  const llm = ctx.resolveLlmCompleter();
  if (!ctx.metaCommentReplier || !llm) {
    return;
  }
  enqueueSchedulablePendingComments(ctx);
  const pending = pickLatestPendingCommentPerAuthorOnPost(ctx.comments.listPendingForAgentReply());
  for (const comment of pending) {
    await processCommentReply(ctx, comment.id, {
      trigger: "worker",
      llmCompleter: llm,
      metaCommentReplier: ctx.metaCommentReplier,
    });
        await processCommentPrivateReply(ctx, comment.id, {
          trigger: "worker",
          llmCompleter: llm,
          metaMessageSender: ctx.metaMessageSender,
        });
  }
}

export async function runMessageResponderTick(ctx: AppContext): Promise<void> {
  const llm = ctx.resolveLlmCompleter();
  if (!ctx.metaMessageSender || !llm) {
    return;
  }
  const pending = pickLatestPendingMessagePerConversation(ctx.messages.listPendingForAgentReply());
  for (const message of pending) {
    await processMessageReply(ctx, message.id, {
      trigger: "worker",
      llmCompleter: llm,
      metaMessageSender: ctx.metaMessageSender,
    });
  }
}

export function startAccountWorkers(
  listContexts: () => AppContext[],
  intervalMs = 60_000,
): () => void {
  let running = false;
  const timer = setInterval(() => {
    if (running) {
      return;
    }
    running = true;
    void (async () => {
      for (const ctx of listContexts()) {
        try {
          await runPublishTick(ctx);
          await runCommentResponderTick(ctx);
          await runMessageResponderTick(ctx);
        } catch {
          // One account must not stop the others.
        }
      }
    })().finally(() => {
      running = false;
    });
  }, intervalMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return () => {
    clearInterval(timer);
  };
}
