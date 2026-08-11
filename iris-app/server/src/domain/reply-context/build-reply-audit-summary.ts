import type { ReplyContext } from "./types.ts";

export type ReplyAuditSummary = {
  post_id: string | null;
  thread_length: number;
  asset_count: number;
  vision_assets: number;
  author_handle: string | null;
};

export function buildReplyAuditSummary(context: ReplyContext): ReplyAuditSummary {
  return {
    post_id: context.post?.postId ?? null,
    thread_length: context.thread.entries.length,
    asset_count: context.post?.assets.length ?? 0,
    vision_assets: context.imageContext.summaries.length,
    author_handle: truncateHandle(context.targetComment.authorUsername),
  };
}

export function serializeReplyAuditSummary(summary: ReplyAuditSummary): string {
  return JSON.stringify(summary);
}

function truncateHandle(handle: string | null): string | null {
  if (!handle) {
    return null;
  }

  return handle.length > 32 ? handle.slice(0, 32) : handle;
}
