import type { Post, PostAsset } from "../../domain/post.ts";
import type { ReplyMode } from "../../domain/reply-mode.ts";
import type { Comment } from "../../domain/comment.ts";

type PostRow = {
  id: string;
  status: string;
  channel: string;
  caption: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  ig_media_id: string | null;
  source_note: string | null;
  error_message: string | null;
  auto_reply_enabled: number;
  reply_mode: string;
  created_at: string;
  updated_at: string;
  assets_count?: number | string;
};

type CommentRow = {
  id: string;
  ig_comment_id: string;
  post_id: string;
  parent_ig_comment_id: string | null;
  author_username: string | null;
  text: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  ig_timestamp: string | null;
};

type AssetRow = {
  id: string;
  post_id: string;
  sort_order: number;
  storage_path: string;
  original_filename: string | null;
  mime: string;
  width: number | null;
  height: number | null;
  original_size_bytes: number | null;
  optimized_size_bytes: number | null;
  created_at: string;
};

export function mapPostRow(row: PostRow): Post {
  return {
    id: row.id,
    status: row.status as Post["status"],
    channel: row.channel,
    caption: row.caption,
    scheduledAt: row.scheduled_at,
    publishedAt: row.published_at,
    igMediaId: row.ig_media_id,
    sourceNote: row.source_note,
    errorMessage: row.error_message,
    autoReplyEnabled: row.auto_reply_enabled === 1,
    replyMode: (row.reply_mode ?? "off") as ReplyMode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assetsCount:
      row.assets_count !== undefined ? Number(row.assets_count) : undefined,
  };
}

export function mapCommentRow(row: CommentRow): Comment {
  return {
    id: row.id,
    igCommentId: row.ig_comment_id,
    postId: row.post_id,
    parentIgCommentId: row.parent_ig_comment_id,
    authorUsername: row.author_username,
    text: row.text,
    status: row.status as Comment["status"],
    errorMessage: row.error_message,
    createdAt: row.created_at,
    igTimestamp: row.ig_timestamp ?? null,
  };
}

export function serializeComment(comment: Comment) {
  return {
    id: comment.id,
    ig_comment_id: comment.igCommentId,
    post_id: comment.postId,
    parent_ig_comment_id: comment.parentIgCommentId,
    author_username: comment.authorUsername,
    text: comment.text,
    status: comment.status,
    error_message: comment.errorMessage,
    created_at: comment.createdAt,
  };
}

export function mapAssetRow(row: AssetRow): PostAsset {
  return {
    id: row.id,
    postId: row.post_id,
    sortOrder: row.sort_order,
    storagePath: row.storage_path,
    originalFilename: row.original_filename,
    mime: row.mime,
    width: row.width,
    height: row.height,
    originalSizeBytes: row.original_size_bytes,
    optimizedSizeBytes: row.optimized_size_bytes,
    createdAt: row.created_at,
  };
}

export function serializePost(post: Post) {
  const payload: Record<string, unknown> = {
    id: post.id,
    status: post.status,
    channel: post.channel,
    caption: post.caption,
    scheduled_at: post.scheduledAt,
    published_at: post.publishedAt,
    ig_media_id: post.igMediaId,
    source_note: post.sourceNote,
    error_message: post.errorMessage,
    auto_reply_enabled: post.autoReplyEnabled,
    reply_mode: post.replyMode,
    created_at: post.createdAt,
    updated_at: post.updatedAt,
  };

  if (post.assetsCount !== undefined) {
    payload.assets_count = post.assetsCount;
  }

  return payload;
}

export function serializeAsset(asset: PostAsset) {
  return {
    id: asset.id,
    post_id: asset.postId,
    sort_order: asset.sortOrder,
    storage_path: asset.storagePath,
    original_filename: asset.originalFilename,
    mime: asset.mime,
    width: asset.width,
    height: asset.height,
    original_size_bytes: asset.originalSizeBytes,
    optimized_size_bytes: asset.optimizedSizeBytes,
    created_at: asset.createdAt,
  };
}
