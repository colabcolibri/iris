import type { CommentRepository } from "../../ports/comment-repository.ts";
import type { CommentThreadContext, CommentThreadEntry } from "./thread-context.ts";

export type BuildCommentThreadContextDeps = {
  comments: CommentRepository;
};

export function buildCommentThreadContext(
  commentId: string,
  deps: BuildCommentThreadContextDeps,
): CommentThreadContext | null {
  const target = deps.comments.findById(commentId);
  if (!target) {
    return null;
  }

  const postComments = deps.comments.listByPostId(target.postId);
  const sentReplies = deps.comments.listSentRepliesByPostId(target.postId);
  const replyByCommentId = new Map(
    sentReplies.map((reply) => [reply.commentId, reply.sentText]),
  );

  const entries: CommentThreadEntry[] = [];

  for (const comment of postComments) {
    entries.push({
      author: comment.authorUsername,
      text: comment.text,
      isBrandReply: false,
      at: comment.createdAt,
      igCommentId: comment.igCommentId,
    });

    const sentText = replyByCommentId.get(comment.id);
    if (sentText) {
      entries.push({
        author: "marca",
        text: sentText,
        isBrandReply: true,
        at: comment.createdAt,
      });
    }
  }

  return { entries };
}
