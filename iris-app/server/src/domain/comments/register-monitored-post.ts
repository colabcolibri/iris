import type { Post } from "../post.ts";
import type { MetaCommentReader } from "../../ports/meta-comment-reader.ts";
import type { PostRepository } from "../../ports/post-repository.ts";
import { parseInstagramMediaInput } from "./parse-instagram-media-input.ts";
import { resolveMonitoredPostMedia } from "./resolve-monitored-post-media.ts";
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
    if (existing.status === "monitored") {
      return existing;
    }

    if (existing.status === "published") {
      return existing;
    }

    throw new ValidationError(
      "post with this ig_media_id already exists with a different status",
    );
  }

  return deps.posts.create({
    channel: "instagram",
    status: "monitored",
    caption: metadata.caption,
    igMediaId: metadata.igMediaId,
    publishedAt: metadata.timestamp,
    sourceNote: "monitored externally",
    replyMode: "inherit",
  });
}
