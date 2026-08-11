import type { PostRepository } from "../../ports/post-repository.ts";
import type { MetaCommentReader } from "../../ports/meta-comment-reader.ts";
import { probeIgMediaAvailability } from "./probe-ig-media-availability.ts";
import type { IgMediaAvailability, IgMediaStatus } from "./ig-media-status.ts";

export type RefreshPostIgMediaStatusDeps = {
  posts: PostRepository;
  metaCommentReader: MetaCommentReader;
};

export type RefreshPostIgMediaStatusResult = {
  postId: string;
  igMediaId: string;
  availability: IgMediaAvailability;
};

export async function refreshPostIgMediaStatus(
  postId: string,
  deps: RefreshPostIgMediaStatusDeps,
): Promise<RefreshPostIgMediaStatusResult | null> {
  const post = deps.posts.findById(postId);
  if (!post?.igMediaId) {
    return null;
  }

  const availability = await probeIgMediaAvailability(
    deps.metaCommentReader,
    post.igMediaId,
  );

  deps.posts.update(postId, {
    igMediaStatus: availability.status,
    igMediaStatusDetail: availability.detail,
    igMediaStatusCheckedAt: new Date().toISOString(),
  });

  return {
    postId,
    igMediaId: post.igMediaId,
    availability,
  };
}

export function isIgMediaOperational(status: IgMediaStatus | null | undefined): boolean {
  return status === "on_feed" || status == null;
}
