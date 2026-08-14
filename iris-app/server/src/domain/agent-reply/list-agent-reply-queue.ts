import type { AppSettings } from "../../ports/app-settings-store.ts";
import type { CommentRepository } from "../../ports/comment-repository.ts";
import type { MessageRepository } from "../../ports/message-repository.ts";
import {
  pickLatestPendingCommentPerAuthorOnPost,
  pickLatestPendingMessagePerConversation,
} from "./agent-reply-debounce.ts";

export type AgentReplyQueuePhase = "debouncing" | "due";

export type AgentReplyQueueItem = {
  id: string;
  channel: "dm" | "comment";
  phase: AgentReplyQueuePhase;
  agentReplyNotBefore: string;
  textPreview: string;
  authorLabel: string;
  contextLabel: string;
  occurredAt: string;
  conversationId: string | null;
  postId: string | null;
  messageId: string | null;
  commentId: string | null;
  aiLocked: boolean;
};

export type AgentReplyQueueSnapshot = {
  generatedAt: string;
  workerTickIntervalSeconds: number;
  messageDebounceSeconds: number;
  commentDebounceSeconds: number;
  counts: {
    debouncing: number;
    due: number;
    total: number;
  };
  items: AgentReplyQueueItem[];
};

function previewText(value: string | null | undefined, max = 120): string {
  const text = value?.trim();
  if (!text) {
    return "(sem texto)";
  }
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
}

function formatHandle(username: string | null | undefined, fallback: string): string {
  const value = username?.trim() || fallback;
  return value.startsWith("@") ? value : `@${value}`;
}

function classifyPhase(notBeforeIso: string, now: Date): AgentReplyQueuePhase {
  return new Date(notBeforeIso).getTime() <= now.getTime() ? "due" : "debouncing";
}

export type ListAgentReplyQueueDeps = {
  messages: MessageRepository;
  comments: CommentRepository;
  settings: AppSettings;
  now?: Date;
};

export function listAgentReplyQueue(deps: ListAgentReplyQueueDeps): AgentReplyQueueSnapshot {
  const now = deps.now ?? new Date();
  const nowMs = now.getTime();

  const messageRows = pickLatestPendingMessagePerConversation(
    deps.messages.listScheduledForAgentReply(),
  );
  const commentRows = pickLatestPendingCommentPerAuthorOnPost(
    deps.comments.listScheduledForAgentReply(),
  );

  const items: AgentReplyQueueItem[] = [];

  for (const row of messageRows) {
    if (!row.agentReplyNotBefore) {
      continue;
    }
    items.push({
      id: `dm:${row.id}`,
      channel: "dm",
      phase: classifyPhase(row.agentReplyNotBefore, now),
      agentReplyNotBefore: row.agentReplyNotBefore,
      textPreview: previewText(row.text),
      authorLabel: formatHandle(row.participantUsername, "cliente"),
      contextLabel: "DM",
      occurredAt: row.igTimestamp ?? row.createdAt,
      conversationId: row.conversationId,
      postId: null,
      messageId: row.id,
      commentId: null,
      aiLocked: row.conversationAiLockedUntil
        ? new Date(row.conversationAiLockedUntil).getTime() > nowMs
        : false,
    });
  }

  for (const row of commentRows) {
    if (!row.agentReplyNotBefore) {
      continue;
    }
    items.push({
      id: `comment:${row.id}`,
      channel: "comment",
      phase: classifyPhase(row.agentReplyNotBefore, now),
      agentReplyNotBefore: row.agentReplyNotBefore,
      textPreview: previewText(row.text),
      authorLabel: formatHandle(row.authorUsername, "autor"),
      contextLabel: previewText(row.postCaption, 80),
      occurredAt: row.igTimestamp ?? row.createdAt,
      conversationId: null,
      postId: row.postId,
      messageId: null,
      commentId: row.id,
      aiLocked: false,
    });
  }

  items.sort((left, right) => {
    const phaseOrder = left.phase === right.phase ? 0 : left.phase === "due" ? -1 : 1;
    if (phaseOrder !== 0) {
      return phaseOrder;
    }
    return left.agentReplyNotBefore.localeCompare(right.agentReplyNotBefore);
  });

  const debouncing = items.filter((item) => item.phase === "debouncing").length;
  const due = items.filter((item) => item.phase === "due").length;

  return {
    generatedAt: now.toISOString(),
    workerTickIntervalSeconds: deps.settings.agentReplyTickIntervalSeconds,
    messageDebounceSeconds: deps.settings.messageReplyDelaySeconds,
    commentDebounceSeconds: deps.settings.replyDelaySeconds,
    counts: {
      debouncing,
      due,
      total: items.length,
    },
    items,
  };
}
