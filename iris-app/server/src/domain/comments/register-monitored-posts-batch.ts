import type { Post } from "../post.ts";
import type { MetaCommentReader } from "../../ports/meta-comment-reader.ts";
import type { PostRepository } from "../../ports/post-repository.ts";
import { registerMonitoredPost } from "./register-monitored-post.ts";
import { ValidationError } from "../../api/json.ts";

export type RegisterMonitoredPostsBatchDeps = {
  posts: PostRepository;
  metaCommentReader: MetaCommentReader;
};

export type RegisterMonitoredPostsBatchResult = {
  imported: Post[];
  skipped: Array<{ ig_media_id: string; reason: string }>;
};

export async function registerMonitoredPostsBatch(
  igMediaIds: unknown,
  deps: RegisterMonitoredPostsBatchDeps,
): Promise<RegisterMonitoredPostsBatchResult> {
  if (!Array.isArray(igMediaIds) || igMediaIds.length === 0) {
    throw new ValidationError("ig_media_ids must be a non-empty array");
  }

  const uniqueIds = [
    ...new Set(
      igMediaIds
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];

  if (uniqueIds.length === 0) {
    throw new ValidationError("ig_media_ids must contain valid media ids");
  }

  const imported: Post[] = [];
  const skipped: Array<{ ig_media_id: string; reason: string }> = [];

  for (const igMediaId of uniqueIds) {
    const existing = deps.posts.findByIgMediaId(igMediaId);
    if (
      existing &&
      (existing.status === "monitored" || existing.status === "published")
    ) {
      skipped.push({ ig_media_id: igMediaId, reason: "already_managed" });
      continue;
    }

    try {
      const post = await registerMonitoredPost({ ig_media_id: igMediaId }, deps);
      imported.push(post);
    } catch (error) {
      skipped.push({
        ig_media_id: igMediaId,
        reason: error instanceof Error ? error.message : "import_failed",
      });
    }
  }

  return { imported, skipped };
}
