import type { AgentReplyQueueSnapshot } from "@/lib/types";

export function getDemoAgentReplyQueue(): AgentReplyQueueSnapshot {
  const now = Date.now();
  const debouncingAt = new Date(now + 90_000).toISOString();
  const dueAt = new Date(now - 15_000).toISOString();

  return {
    generated_at: new Date(now).toISOString(),
    worker_tick_interval_seconds: 30,
    message_debounce_seconds: 120,
    comment_debounce_seconds: 120,
    counts: {
      debouncing: 1,
      due: 1,
      total: 2,
    },
    items: [
      {
        id: "dm:demo-queue-1",
        channel: "dm",
        phase: "debouncing",
        agent_reply_not_before: debouncingAt,
        text_preview: "Oi! Vocês entregam para o interior?",
        author_label: "@maria",
        context_label: "DM",
        occurred_at: new Date(now - 30_000).toISOString(),
        conversation_id: "demo-conv-1",
        post_id: null,
        message_id: "demo-msg-queue-1",
        comment_id: null,
        ai_locked: false,
      },
      {
        id: "comment:demo-queue-2",
        channel: "comment",
        phase: "due",
        agent_reply_not_before: dueAt,
        text_preview: "Qual o valor do conjunto?",
        author_label: "@joao",
        context_label: "Lookbook verão · carrossel",
        occurred_at: new Date(now - 180_000).toISOString(),
        conversation_id: null,
        post_id: "demo-post-1",
        message_id: null,
        comment_id: "demo-comment-queue-1",
        ai_locked: false,
      },
    ],
  };
}
