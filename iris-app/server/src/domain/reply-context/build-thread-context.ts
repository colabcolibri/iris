import type { Comment } from "../comments/comment.ts";
import type { CommentRepository } from "../../ports/comment-repository.ts";
import {
  sortThreadEntriesChronologically,
  type CommentThreadContext,
  type CommentThreadEntry,
} from "./thread-context.ts";
import {
  buildCommentTree,
  findCommentTreePath,
  type CommentTreeNode,
} from "./build-comment-tree.ts";

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
  const roots = buildCommentTree(postComments);
  const path = findCommentTreePath(roots, target.igCommentId);

  if (!path) {
    return { entries: [] };
  }

  const sentReplies = deps.comments.listSentRepliesByPostId(target.postId);
  const replyByCommentId = new Map(
    sentReplies.map((reply) => [reply.commentId, reply.sentText]),
  );

  const entries: CommentThreadEntry[] = [];

  for (let index = 0; index < path.ancestors.length; index += 1) {
    appendCommentNode(entries, path.ancestors[index]!, replyByCommentId, index);
  }

  appendCommentSubtree(entries, path.node, replyByCommentId, path.ancestors.length);

  return { entries: sortThreadEntriesChronologically(entries) };
}

function appendCommentSubtree(
  entries: CommentThreadEntry[],
  node: CommentTreeNode,
  replyByCommentId: Map<string, string>,
  depth: number,
): void {
  appendCommentNode(entries, node, replyByCommentId, depth);

  for (const child of node.children) {
    appendCommentSubtree(entries, child, replyByCommentId, depth + 1);
  }
}

function commentTimestamp(comment: Comment): string {
  return comment.igTimestamp ?? comment.createdAt;
}

function brandReplyTimestamp(parentAt: string): string {
  const parentMs = new Date(parentAt).getTime();
  if (Number.isNaN(parentMs)) {
    return parentAt;
  }
  return new Date(parentMs + 1).toISOString();
}

function appendCommentNode(
  entries: CommentThreadEntry[],
  node: CommentTreeNode,
  replyByCommentId: Map<string, string>,
  depth: number,
): void {
  const at = commentTimestamp(node.comment);

  entries.push({
    author: node.comment.authorUsername,
    text: node.comment.text,
    isBrandReply: false,
    at,
    igCommentId: node.comment.igCommentId,
    depth,
  });

  const sentText = replyByCommentId.get(node.comment.id);
  if (sentText) {
    entries.push({
      author: "marca",
      text: sentText,
      isBrandReply: true,
      at: brandReplyTimestamp(at),
      depth,
    });
  }
}
