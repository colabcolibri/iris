import type { CommentRepository } from "../../ports/comment-repository.ts";
import type { MessageRepository } from "../../ports/message-repository.ts";
import type { Comment } from "../comments/comment.ts";
import type { Message } from "../messages/message.ts";
import {
  AGENT_REPLY_SUPERSEDED_REASON,
  isOlderComment,
  isOlderMessage,
  normalizeCommentAuthorKey,
} from "./agent-reply-debounce.ts";

export function supersedeOlderPendingMessageReplies(
  messages: MessageRepository,
  conversationId: string,
  keepMessage: Message,
): number {
  let superseded = 0;

  for (const message of messages.listByConversationId(conversationId)) {
    if (
      message.id === keepMessage.id ||
      message.direction !== "inbound" ||
      message.status !== "pending" ||
      !isOlderMessage(message, keepMessage)
    ) {
      continue;
    }

    messages.clearAgentReplySchedule(message.id);
    messages.markSkipped(message.id, AGENT_REPLY_SUPERSEDED_REASON);
    superseded += 1;
  }

  return superseded;
}

export function supersedeOlderPendingCommentReplies(
  comments: CommentRepository,
  keepComment: Comment,
): number {
  const authorKey = normalizeCommentAuthorKey(keepComment.authorUsername);
  let superseded = 0;

  for (const comment of comments.listByPostId(keepComment.postId)) {
    if (
      comment.id === keepComment.id ||
      comment.status !== "pending" ||
      comment.deletedAt ||
      normalizeCommentAuthorKey(comment.authorUsername) !== authorKey ||
      !isOlderComment(comment, keepComment)
    ) {
      continue;
    }

    comments.clearAgentReplySchedule(comment.id);
    comments.markSkipped(comment.id, AGENT_REPLY_SUPERSEDED_REASON);
    superseded += 1;
  }

  return superseded;
}
