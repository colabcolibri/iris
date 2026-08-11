import { ValidationError } from "../../api/json.ts";

export type CommentActivityKind = "pending_approval" | "recent_public" | "recent_iris";

export const COMMENT_ACTIVITY_KINDS: CommentActivityKind[] = [
  "pending_approval",
  "recent_public",
  "recent_iris",
];

export const COMMENT_ACTIVITY_DEFAULT_LIMIT = 20;
export const COMMENT_ACTIVITY_MAX_LIMIT = 50;

export type CommentActivityRow = {
  commentId: string;
  postId: string;
  igMediaId: string | null;
  authorUsername: string | null;
  text: string | null;
  commentStatus: string;
  occurredAt: string;
  draftText: string | null;
  sentText: string | null;
  postCaption: string | null;
  postPendingCount: number;
};

export type CommentActivityItem = {
  commentId: string;
  postId: string;
  igMediaId: string | null;
  textPreview: string;
  authorUsername: string | null;
  occurredAt: string;
  postCaptionPreview: string | null;
  postPendingCount: number;
  draftTextPreview: string | null;
  sentTextPreview: string | null;
};

export function parseCommentActivityKind(value: string | null | undefined): CommentActivityKind {
  const normalized = value?.trim();
  if (!normalized || !COMMENT_ACTIVITY_KINDS.includes(normalized as CommentActivityKind)) {
    throw new ValidationError(
      `kind must be one of: ${COMMENT_ACTIVITY_KINDS.join(", ")}`,
    );
  }
  return normalized as CommentActivityKind;
}

export function clampCommentActivityLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return COMMENT_ACTIVITY_DEFAULT_LIMIT;
  }
  return Math.min(
    COMMENT_ACTIVITY_MAX_LIMIT,
    Math.max(1, Math.floor(value as number)),
  );
}

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

export function mapCommentActivityRow(row: CommentActivityRow): CommentActivityItem {
  return {
    commentId: row.commentId,
    postId: row.postId,
    igMediaId: row.igMediaId,
    textPreview: previewText(row.text),
    authorUsername: row.authorUsername,
    occurredAt: row.occurredAt,
    postCaptionPreview: row.postCaption ? previewText(row.postCaption, 80) : null,
    postPendingCount: row.postPendingCount,
    draftTextPreview: row.draftText ? previewText(row.draftText) : null,
    sentTextPreview: row.sentText ? previewText(row.sentText) : null,
  };
}

export type ListCommentActivityInput = {
  kind: CommentActivityKind;
  limit?: number;
  brandUsername: string | null;
  listActivityRows: (
    kind: CommentActivityKind,
    limit: number,
    brandUsername: string | null,
  ) => CommentActivityRow[];
};

export function listCommentActivity(input: ListCommentActivityInput): CommentActivityItem[] {
  const limit = clampCommentActivityLimit(input.limit);
  const rows = input.listActivityRows(input.kind, limit, input.brandUsername);
  return rows.map(mapCommentActivityRow);
}
