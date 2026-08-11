import { ROUTES } from "@/lib/routes";

/** Deep link do hub de comentários — stage exige post_id. */
export function commentsThreadHref(
  postId: string | null | undefined,
  commentId?: string | null,
): string | null {
  const post = postId?.trim();
  if (!post) {
    return null;
  }
  const params = new URLSearchParams({ post_id: post });
  const comment = commentId?.trim();
  if (comment) {
    params.set("comment_id", comment);
  }
  return `${ROUTES.admin.comments}?${params.toString()}`;
}
