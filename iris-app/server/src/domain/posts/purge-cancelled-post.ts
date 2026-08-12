import type { AssetRepository } from "../../ports/asset-repository.ts";
import type { MediaStorage } from "../../ports/media-storage.ts";
import type { PostRepository } from "../../ports/post-repository.ts";
import { filenameFromStoragePath } from "./publish-url.ts";

export class PurgeCancelledPostError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PurgeCancelledPostError";
    this.status = status;
  }
}

export type PurgeCancelledPostDeps = {
  posts: PostRepository;
  assets: AssetRepository;
  mediaStorage: MediaStorage;
};

/**
 * Apaga definitivamente uma postagem cancelada (banco + arquivos de mídia).
 * `agent_runs` / steps permanecem — só desvincula `comment_id`.
 */
export async function purgeCancelledPost(
  postId: string,
  deps: PurgeCancelledPostDeps,
): Promise<void> {
  const post = deps.posts.findById(postId);
  if (!post) {
    throw new PurgeCancelledPostError("post not found", 404);
  }
  if (post.status !== "cancelled") {
    throw new PurgeCancelledPostError(
      "only cancelled posts can be permanently deleted",
      409,
    );
  }

  const assets = deps.assets.listByPostId(postId);
  for (const asset of assets) {
    const filename = filenameFromStoragePath(asset.storagePath);
    await deps.mediaStorage.delete(postId, filename);
  }

  const purged = deps.posts.purgeCancelled(postId);
  if (!purged) {
    throw new PurgeCancelledPostError("post not found", 404);
  }
}
