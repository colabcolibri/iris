import { sendError } from "./json.ts";
import type { Post } from "../domain/posts/post.ts";
import type { Comment } from "../domain/comments/comment.ts";
import type { RouteMatch } from "./route-types.ts";

export function routeParam(match: RouteMatch, name: string): string {
  const value = match.params[name];
  if (!value) {
    throw new Error(`missing route param: ${name}`);
  }
  return value;
}

export function requirePost(match: RouteMatch, postId: string): Post | null {
  const post = match.ctx.posts.findById(postId);
  if (!post) {
    sendError(match.res, 404, "post not found");
    return null;
  }
  return post;
}

export function requireComment(
  match: RouteMatch,
  commentId: string,
  options?: { rejectDeleted?: boolean },
): Comment | null {
  const comment = match.ctx.comments.findById(commentId);
  if (!comment) {
    sendError(match.res, 404, "comment not found");
    return null;
  }

  if (options?.rejectDeleted && comment.deletedAt) {
    sendError(match.res, 410, "comment was removed from instagram");
    return null;
  }

  return comment;
}
