import type { Comment } from "./types";

function parseCommentTimestampMs(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const normalized = trimmed.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const ms = Date.parse(normalized);
  return Number.isNaN(ms) ? 0 : ms;
}

export type CommentTreeNode = Comment & {
  children: CommentTreeNode[];
};

export type ThreadSortMode =
  | "activity_desc"
  | "activity_asc"
  | "root_desc"
  | "root_asc"
  | "pending_first";

export type CommentThreadGroup = {
  root: Comment;
  replies: Comment[];
};

export const THREAD_SORT_OPTIONS: Array<{ value: ThreadSortMode; label: string }> = [
  { value: "activity_desc", label: "Atividade mais recente" },
  { value: "activity_asc", label: "Atividade mais antiga" },
  { value: "root_desc", label: "Comentário raiz mais recente" },
  { value: "root_asc", label: "Comentário raiz mais antigo" },
  { value: "pending_first", label: "Pendentes primeiro" },
];

export function commentTimestamp(comment: Pick<Comment, "created_at" | "ig_timestamp">): string {
  return comment.ig_timestamp ?? comment.created_at;
}

export function commentTimeMs(comment: Pick<Comment, "created_at" | "ig_timestamp">): number {
  return parseCommentTimestampMs(commentTimestamp(comment));
}

export function formatCommentExactTime(value: string): string {
  const ms = parseCommentTimestampMs(value);
  if (!ms) {
    return value;
  }

  return new Date(ms).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function normalizeUsername(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  return value.trim().toLowerCase().replace(/^@/, "");
}

export function isBrandAuthor(
  authorUsername: string | null | undefined,
  brandUsername: string | null | undefined,
): boolean {
  const author = normalizeUsername(authorUsername);
  const brand = normalizeUsername(brandUsername);
  return Boolean(author && brand && author === brand);
}

export function threadContainsIgId(
  group: CommentThreadGroup,
  igCommentId: string | null | undefined,
): boolean {
  if (!igCommentId) {
    return false;
  }

  return [group.root, ...group.replies].some((comment) => comment.ig_comment_id === igCommentId);
}

export function shouldShowLinkedReply(
  comment: Pick<
    Comment,
    "ig_comment_id" | "linked_reply_text" | "linked_reply_ig_comment_id"
  >,
  group: CommentThreadGroup,
  brandUsername?: string | null,
): boolean {
  if (!comment.linked_reply_text) {
    return false;
  }

  if (threadContainsIgId(group, comment.linked_reply_ig_comment_id)) {
    return false;
  }

  const userIgId = comment.ig_comment_id;
  if (!userIgId) {
    return true;
  }

  return !group.replies.some(
    (reply) =>
      reply.parent_ig_comment_id === userIgId &&
      isBrandAuthor(reply.author_username, brandUsername),
  );
}

function dedupeComments(comments: Comment[]): Comment[] {
  const byId = new Map<string, Comment>();
  const byIgId = new Map<string, Comment>();

  for (const comment of comments) {
    if (byId.has(comment.id)) {
      continue;
    }

    if (comment.ig_comment_id && byIgId.has(comment.ig_comment_id)) {
      continue;
    }

    byId.set(comment.id, comment);
    if (comment.ig_comment_id) {
      byIgId.set(comment.ig_comment_id, comment);
    }
  }

  return [...byId.values()];
}

function compareCommentsChronologically(left: Comment, right: Comment): number {
  const diff = commentTimeMs(left) - commentTimeMs(right);
  if (diff !== 0) {
    return diff;
  }

  const leftIgId = left.ig_comment_id ?? "";
  const rightIgId = right.ig_comment_id ?? "";
  if (leftIgId !== rightIgId) {
    return leftIgId.localeCompare(rightIgId);
  }

  return left.id.localeCompare(right.id);
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

export function resolveThreadRoot(comment: Comment, byIgId: Map<string, Comment>): Comment {
  let current = comment;
  const visited = new Set<string>();

  while (current.parent_ig_comment_id) {
    const parentId = current.parent_ig_comment_id;
    if (!parentId || visited.has(parentId)) {
      break;
    }
    visited.add(parentId);
    const parent = byIgId.get(parentId);
    if (!parent) {
      break;
    }
    current = parent;
  }

  return current;
}

export function buildCommentThreadGroups(comments: Comment[]): CommentThreadGroup[] {
  const uniqueComments = dedupeComments(comments);
  const byIgId = indexCommentsByIgId(uniqueComments);
  const byId = new Map(uniqueComments.map((comment) => [comment.id, comment]));
  const buckets = new Map<string, Comment[]>();

  for (const comment of uniqueComments) {
    const root = resolveThreadRoot(comment, byIgId);
    const members = buckets.get(root.id) ?? [];
    members.push(comment);
    buckets.set(root.id, members);
  }

  const groups: CommentThreadGroup[] = [];
  for (const [rootId, members] of buckets) {
    const root = byId.get(rootId);
    if (!root) {
      continue;
    }

    const replies = members
      .filter((member) => member.id !== rootId)
      .sort(compareCommentsChronologically);

    groups.push({ root, replies });
  }

  return groups;
}

export function threadActivityMs(group: CommentThreadGroup): number {
  const stamps = [group.root, ...group.replies].map((comment) => commentTimeMs(comment));
  return Math.max(...stamps, 0);
}

export function threadNeedsAttention(group: CommentThreadGroup): boolean {
  return [group.root, ...group.replies].some(
    (comment) => comment.status === "pending" || Boolean(comment.draft_text),
  );
}

export function sortCommentThreadGroups(
  groups: CommentThreadGroup[],
  mode: ThreadSortMode,
): CommentThreadGroup[] {
  const sorted = [...groups];

  sorted.sort((left, right) => {
    switch (mode) {
      case "activity_desc":
        return threadActivityMs(right) - threadActivityMs(left);
      case "activity_asc":
        return threadActivityMs(left) - threadActivityMs(right);
      case "root_desc":
        return commentTimeMs(right.root) - commentTimeMs(left.root);
      case "root_asc":
        return commentTimeMs(left.root) - commentTimeMs(right.root);
      case "pending_first": {
        const leftPending = threadNeedsAttention(left) ? 1 : 0;
        const rightPending = threadNeedsAttention(right) ? 1 : 0;
        if (leftPending !== rightPending) {
          return rightPending - leftPending;
        }
        return threadActivityMs(right) - threadActivityMs(left);
      }
      default:
        return 0;
    }
  });

  return sorted;
}

export function defaultCollapsedThreadIds(groups: CommentThreadGroup[]): Set<string> {
  return new Set(
    groups.filter((group) => group.replies.length > 0).map((group) => group.root.id),
  );
}

/** @deprecated Use buildCommentThreadGroups for the admin UI. */
export function buildCommentTree(comments: Comment[]): CommentTreeNode[] {
  return buildCommentThreadGroups(comments).map((group) => ({
    ...group.root,
    children: group.replies.map((reply) => ({
      ...reply,
      children: [],
    })),
  }));
}
