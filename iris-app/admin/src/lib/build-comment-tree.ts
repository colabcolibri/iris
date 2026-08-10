import type { Comment } from "@/lib/types";

export type CommentTreeNode = Comment & {
  children: CommentTreeNode[];
};

export function buildCommentTree(comments: Comment[]): CommentTreeNode[] {
  const byIgId = new Map(
    comments
      .filter((comment) => comment.ig_comment_id)
      .map((comment) => [comment.ig_comment_id!, comment]),
  );
  const childrenByParent = new Map<string, Comment[]>();

  for (const comment of comments) {
    const parentId = comment.parent_ig_comment_id;
    if (!parentId || !byIgId.has(parentId)) {
      continue;
    }

    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(comment);
    childrenByParent.set(parentId, siblings);
  }

  const attachChildren = (comment: Comment): CommentTreeNode => {
    const igCommentId = comment.ig_comment_id;
    const rawChildren = igCommentId ? (childrenByParent.get(igCommentId) ?? []) : [];
    return {
      ...comment,
      children: rawChildren.map((child) => attachChildren(child)),
    };
  };

  const roots = comments.filter((comment) => {
    const parentId = comment.parent_ig_comment_id;
    return !parentId || !byIgId.has(parentId);
  });

  return roots.map((root) => attachChildren(root));
}

export function indexCommentsByIgId(comments: Comment[]): Map<string, Comment> {
  const map = new Map<string, Comment>();
  for (const comment of comments) {
    if (comment.ig_comment_id) {
      map.set(comment.ig_comment_id, comment);
    }
  }
  return map;
}
