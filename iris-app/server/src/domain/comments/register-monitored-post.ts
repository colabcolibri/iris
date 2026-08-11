import type { Post } from "../posts/post.ts";
import type { MetaCommentReader } from "../../ports/meta-comment-reader.ts";
import type { PostRepository } from "../../ports/post-repository.ts";
import { parseInstagramMediaInput } from "./parse-instagram-media-input.ts";
import { resolveMonitoredPostMedia } from "./resolve-monitored-post-media.ts";
import { persistPostEngagement } from "../posts/persist-post-engagement.ts";
import { ValidationError } from "../../api/json.ts";

export type RegisterMonitoredPostInput = {
  ig_media_id?: unknown;
  permalink?: unknown;
};

export type RegisterMonitoredPostDeps = {
  posts: PostRepository;
  metaCommentReader: MetaCommentReader;
};

export async function registerMonitoredPost(
  input: RegisterMonitoredPostInput,
  deps: RegisterMonitoredPostDeps,
): Promise<Post> {
  const parsed = parseInstagramMediaInput(input);
  const metadata = await resolveMonitoredPostMedia(parsed, deps.metaCommentReader);
  const igMediaId = metadata.igMediaId;
  const existing = deps.posts.findByIgMediaId(igMediaId);

  if (existing) {
    if (existing.status === "monitored" || existing.status === "published") {
      persistPostEngagement(deps.posts, existing.id, {
        likeCount: metadata.likeCount ?? null,
        reportedCommentsCount: metadata.commentsCount ?? null,
      });
      return deps.posts.findById(existing.id) ?? existing;
    }

    throw new ValidationError(
      "post with this ig_media_id already exists with a different status",
    );
  }

  const post = deps.posts.create({
    channel: "instagram",
    status: "monitored",
    caption: metadata.caption,
    igMediaId: metadata.igMediaId,
    publishedAt: metadata.timestamp,
    sourceNote: "monitored externally",
    replyMode: "inherit",
  });

  persistPostEngagement(deps.posts, post.id, {
    likeCount: metadata.likeCount ?? null,
    reportedCommentsCount: metadata.commentsCount ?? null,
  });

  return deps.posts.findById(post.id) ?? post;
}
