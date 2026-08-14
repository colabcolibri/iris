import { sendJson } from "../json.ts";
import { createRouter, route } from "../router.ts";
import { getAppSettingsOrDefault } from "../../adapters/sqlite/app-settings-repository.ts";
import { listAgentReplyQueue } from "../../domain/agent-reply/list-agent-reply-queue.ts";

function serializeQueueItem(item: ReturnType<typeof listAgentReplyQueue>["items"][number]) {
  return {
    id: item.id,
    channel: item.channel,
    phase: item.phase,
    agent_reply_not_before: item.agentReplyNotBefore,
    text_preview: item.textPreview,
    author_label: item.authorLabel,
    context_label: item.contextLabel,
    occurred_at: item.occurredAt,
    conversation_id: item.conversationId,
    post_id: item.postId,
    message_id: item.messageId,
    comment_id: item.commentId,
    ai_locked: item.aiLocked,
  };
}

export const handleAgentReplyQueueRoute = createRouter([
  route("GET", "/api/agent-reply-queue", { admin: true }, async (match) => {
    const settings = getAppSettingsOrDefault(match.ctx.appSettingsStore);
    const snapshot = listAgentReplyQueue({
      messages: match.ctx.messages,
      comments: match.ctx.comments,
      settings,
    });

    sendJson(match.res, 200, {
      generated_at: snapshot.generatedAt,
      worker_tick_interval_seconds: snapshot.workerTickIntervalSeconds,
      message_debounce_seconds: snapshot.messageDebounceSeconds,
      comment_debounce_seconds: snapshot.commentDebounceSeconds,
      counts: snapshot.counts,
      items: snapshot.items.map(serializeQueueItem),
    });
  }),
]);
