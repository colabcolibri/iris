import type { Comment } from "../comment.ts";

export type CommentTreeNode = {
  comment: Comment;
  children: CommentTreeNode[];
};

function compareCommentTime(left: Comment, right: Comment): number {
  const leftAt = left.igTimestamp ?? left.createdAt;
  const rightAt = right.igTimestamp ?? right.createdAt;
  return leftAt.localeCompare(rightAt);
}

function sortCommentTree(nodes: CommentTreeNode[]): void {
  nodes.sort((left, right) => compareCommentTime(left.comment, right.comment));
  for (const node of nodes) {
    sortCommentTree(node.children);
  }
}

export function buildCommentTree(comments: Comment[]): CommentTreeNode[] {
  const nodes = new Map<string, CommentTreeNode>();

  for (const comment of comments) {
    nodes.set(comment.igCommentId, { comment, children: [] });
  }

  const roots: CommentTreeNode[] = [];

  for (const comment of comments) {
    const node = nodes.get(comment.igCommentId);
    if (!node) {
      continue;
    }

    const parentId = comment.parentIgCommentId;
    const parent = parentId ? nodes.get(parentId) : null;

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  sortCommentTree(roots);
  return roots;
}

export type CommentTreePath = {
  node: CommentTreeNode;
  ancestors: CommentTreeNode[];
};

export function findCommentTreePath(
  roots: CommentTreeNode[],
  igCommentId: string,
): CommentTreePath | null {
  for (const root of roots) {
    const found = walkCommentTree(root, [], igCommentId);
    if (found) {
      return found;
    }
  }

  return null;
}

function walkCommentTree(
  node: CommentTreeNode,
  ancestors: CommentTreeNode[],
  targetIgCommentId: string,
): CommentTreePath | null {
  if (node.comment.igCommentId === targetIgCommentId) {
    return { node, ancestors };
  }

  for (const child of node.children) {
    const found = walkCommentTree(child, [...ancestors, node], targetIgCommentId);
    if (found) {
      return found;
    }
  }

  return null;
}
