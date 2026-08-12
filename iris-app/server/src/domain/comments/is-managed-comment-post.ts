/** Campos mínimos para decidir se um post entra no inbox de comentários. */
export type ManagedCommentPostCandidate = {
  igMediaId?: string | null;
  ig_media_id?: string | null;
  status: string;
  publishedAt?: string | null;
  published_at?: string | null;
};

/**
 * Post elegível para `/api/comments/posts` (aba Publicações).
 * Não é o kanban nem o calendário editorial: só o que já está no ar no Instagram.
 */
export function isManagedCommentPost(
  post: ManagedCommentPostCandidate,
  now: Date = new Date(),
): boolean {
  const igMediaId = post.igMediaId ?? post.ig_media_id;
  if (!igMediaId) return false;
  if (post.status !== "published" && post.status !== "monitored") return false;

  const publishedAt = post.publishedAt ?? post.published_at;
  if (!publishedAt) return false;

  const publishedTime = Date.parse(publishedAt);
  if (!Number.isFinite(publishedTime)) return false;

  return publishedTime <= now.getTime();
}
