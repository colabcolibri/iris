import type { Post, PostAsset } from "../../domain/post.ts";

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
  created_at: string;
  updated_at: string;
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
  return {
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
    created_at: post.createdAt,
    updated_at: post.updatedAt,
  };
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
