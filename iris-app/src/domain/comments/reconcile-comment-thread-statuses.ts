import type { Comment } from "../comment.ts";
import { buildCommentTree, type CommentTreeNode } from "../reply-context/build-comment-tree.ts";
import { isBrandAuthor } from "./is-brand-author.ts";

export type ReconcileLinkPlan = {
  userCommentId: string;
  brandCommentId: string;
  brandIgCommentId: string;
  sentText: string | null;
};

export type ReconcilePlan = {
  links: ReconcileLinkPlan[];
  skippedBrandCommentIds: string[];
};

export type ReconcileCommentThreadStatusesDeps = {
  listByPostId: (postId: string) => Comment[];
  hasReplyRecord: (commentId: string) => boolean;
  linkInstagramReply: (input: {
    userCommentId: string;
    brandIgCommentId: string;
    sentText: string | null;
  }) => boolean;
  markSkipped: (id: string) => Comment | null;
};

export type ReconcileCommentThreadResult = {
  linkedCount: number;
  skippedBrandCount: number;
  plan: ReconcilePlan;
};

function commentTime(comment: Comment): number {
  return new Date(comment.igTimestamp ?? comment.createdAt).getTime();
}

function flattenTree(node: CommentTreeNode): Comment[] {
  return [node.comment, ...node.children.flatMap((child) => flattenTree(child))];
}

function planTreeNode(
  node: CommentTreeNode,
  brandUsername: string | null,
  hasReplyRecord: (commentId: string) => boolean,
): ReconcilePlan {
  const subtree = flattenTree(node);
  const sorted = [...subtree].sort((a, b) => commentTime(a) - commentTime(b));
  const openUserIds: string[] = [];
  const links: ReconcileLinkPlan[] = [];
  const skippedBrandCommentIds: string[] = [];

  for (const comment of sorted) {
    if (comment.deletedAt) {
      continue;
    }

    if (isBrandAuthor(comment.authorUsername, brandUsername)) {
      if (comment.status === "pending") {
        skippedBrandCommentIds.push(comment.id);
      }

      for (const userCommentId of openUserIds) {
        if (hasReplyRecord(userCommentId)) {
          continue;
        }
        links.push({
          userCommentId,
          brandCommentId: comment.id,
          brandIgCommentId: comment.igCommentId,
          sentText: comment.text,
        });
      }

      openUserIds.length = 0;
      continue;
    }

    openUserIds.push(comment.id);
  }

  return { links, skippedBrandCommentIds };
}

export function planCommentThreadReconciliation(
  postId: string,
  brandUsername: string | null | undefined,
  listByPostId: (postId: string) => Comment[],
  hasReplyRecord: (commentId: string) => boolean,
): ReconcilePlan {
  const comments = listByPostId(postId);
  if (comments.length === 0) {
    return { links: [], skippedBrandCommentIds: [] };
  }

  const brand = brandUsername?.trim() || null;
  const roots = buildCommentTree(comments);
  const merged: ReconcilePlan = { links: [], skippedBrandCommentIds: [] };

  for (const root of roots) {
    const plan = planTreeNode(root, brand, hasReplyRecord);
    merged.links.push(...plan.links);
    merged.skippedBrandCommentIds.push(...plan.skippedBrandCommentIds);
  }

  return merged;
}

export function applyCommentThreadReconciliation(
  plan: ReconcilePlan,
  deps: ReconcileCommentThreadStatusesDeps,
): ReconcileCommentThreadResult {
  let linkedCount = 0;

  for (const link of plan.links) {
    const linked = deps.linkInstagramReply({
      userCommentId: link.userCommentId,
      brandIgCommentId: link.brandIgCommentId,
      sentText: link.sentText,
    });
    if (linked) {
      linkedCount += 1;
    }
  }

  let skippedBrandCount = 0;
  for (const brandCommentId of plan.skippedBrandCommentIds) {
    const updated = deps.markSkipped(brandCommentId);
    if (updated) {
      skippedBrandCount += 1;
    }
  }

  return { linkedCount, skippedBrandCount, plan };
}

/** Vincula comentários de usuário à resposta real da marca já existente no Instagram. */
export function reconcileCommentThreadStatuses(
  postId: string,
  brandUsername: string | null | undefined,
  deps: ReconcileCommentThreadStatusesDeps,
): ReconcileCommentThreadResult {
  const plan = planCommentThreadReconciliation(
    postId,
    brandUsername,
    deps.listByPostId,
    deps.hasReplyRecord,
  );
  return applyCommentThreadReconciliation(plan, deps);
}
