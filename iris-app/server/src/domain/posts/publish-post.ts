import type { AppContext } from "../../api/app-context.ts";
import { ValidationError } from "../../api/json.ts";
import { notifyPostsChanged } from "../../adapters/sse/event-bus.ts";
import type { Post } from "./post.ts";
import type { MetaPublisher } from "../../ports/meta-publisher.ts";
import { assertMetaReadyForSchedule } from "../meta/meta-readiness.ts";

const PUBLISHABLE_STATUSES = new Set<Post["status"]>(["draft", "scheduled", "failed"]);

export class PublishNotConfiguredError extends Error {
  readonly code = "publish_not_configured";

  constructor(message = "Publicação não configurada. Verifique URL pública e segredo de mídia.") {
    super(message);
    this.name = "PublishNotConfiguredError";
  }
}

export async function publishPostNow(
  ctx: AppContext,
  postId: string,
  publisher?: MetaPublisher,
): Promise<Post> {
  const metaPublisher = publisher ?? ctx.metaPublisher;
  if (!metaPublisher) {
    throw new PublishNotConfiguredError();
  }

  assertMetaReadyForSchedule(ctx);

  const post = ctx.posts.findById(postId);
  if (!post) {
    throw new ValidationError("post not found");
  }

  if (!PUBLISHABLE_STATUSES.has(post.status)) {
    throw new ValidationError("post cannot be published in its current status");
  }

  const assets = ctx.assets.listByPostId(postId);
  if (assets.length < 1) {
    throw new ValidationError("post must have at least one asset before publishing");
  }

  try {
    const { igMediaId } = await metaPublisher.publish(postId);
    const updated = ctx.posts.update(postId, {
      status: "published",
      publishedAt: new Date().toISOString(),
      igMediaId,
      errorMessage: null,
    });

    if (!updated) {
      throw new ValidationError("post not found");
    }

    notifyPostsChanged({ post_id: postId });
    return updated;
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 500) : "publish failed";

    ctx.posts.update(postId, {
      status: "failed",
      errorMessage: message,
    });
    notifyPostsChanged({ post_id: postId });
    throw error;
  }
}
