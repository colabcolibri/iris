import type { Asset, Comment, CommentPostSummary, Post } from "@/lib/types";
import { demoPostPreviewUrl } from "@/demo/demo-images";
import { isManagedCommentPost } from "@iris/domain/comments/is-managed-comment-post";

/**
 * Mesmo critério de `/api/comments/posts` em produção:
 * herda de `posts`, mas só o que já está no ar (não kanban, não calendário futuro).
 */
export function isDemoManagedPost(post: Post, now: Date = new Date()): boolean {
  return isManagedCommentPost(
    {
      ig_media_id: post.ig_media_id,
      status: post.status,
      published_at: post.published_at,
    },
    now,
  );
}

export function listDemoManagedPosts(
  posts: Post[],
  now: Date = new Date(),
): Post[] {
  return posts
    .filter((post) => isDemoManagedPost(post, now))
    .sort((left, right) => {
      const leftTime = Date.parse(left.published_at ?? "");
      const rightTime = Date.parse(right.published_at ?? "");
      return rightTime - leftTime;
    });
}

export function countDemoCommentsByPostId(
  comments: Comment[] | undefined,
): { total: number; pending: number } {
  const active = (comments ?? []).filter((comment) => !comment.deleted_at);
  return {
    total: active.length,
    pending: active.filter((comment) => comment.status === "pending").length,
  };
}

/** Espelha `listCommentPosts` + serialização HTTP do inbox de comentários. */
export function listDemoCommentPosts(
  posts: Post[],
  commentsByPost: Record<string, Comment[]>,
  assetsByPost: Record<string, Asset[]>,
  now: Date = new Date(),
): CommentPostSummary[] {
  return listDemoManagedPosts(posts, now).map((post) => {
    const comments = commentsByPost[post.id] ?? [];
    const counts = countDemoCommentsByPostId(comments);
    const reported = 0;
    const firstAsset = assetsByPost[post.id]?.[0];

    return {
      post_id: post.id,
      caption: post.caption,
      carousel_summary: post.carousel_summary ?? null,
      published_at: post.published_at,
      ig_media_id: post.ig_media_id!,
      status: post.status,
      is_external: post.status === "monitored",
      reply_mode: post.reply_mode,
      reply_prompt: post.reply_prompt ?? null,
      silence_soul: post.silence_soul ?? false,
      silence_page: post.silence_page ?? false,
      silence_knowledge: post.silence_knowledge ?? false,
      silence_restrictions: post.silence_restrictions ?? false,
      auto_reply_enabled: post.auto_reply_enabled,
      agent_active_days: post.agent_active_days ?? null,
      private_reply_mode: post.private_reply_mode ?? "inherit",
      like_count: 120 + counts.total * 17,
      reported_comments_count: null,
      comments_count: Math.max(counts.total, reported),
      pending_count: counts.pending,
      preview_filename:
        firstAsset?.original_filename ??
        firstAsset?.storage_path?.split("/").pop() ??
        null,
      preview_mime: firstAsset?.mime ?? "image/jpeg",
      preview_url: demoPostPreviewUrl(post.id),
    };
  });
}
