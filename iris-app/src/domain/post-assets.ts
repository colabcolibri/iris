import { ValidationError } from "../api/json.ts";
import type { AssetRepository } from "../ports/asset-repository.ts";
import type { MediaStorage } from "../ports/media-storage.ts";
import type { PostRepository } from "../ports/post-repository.ts";
import type { PostAsset } from "./post.ts";
import { filenameFromStoragePath } from "./publish-url.ts";
import { AssetIngestError } from "./asset-ingest.ts";

export type PostAssetMutationDeps = {
  posts: PostRepository;
  assets: AssetRepository;
  mediaStorage: MediaStorage;
};

export async function deletePostAsset(
  postId: string,
  assetId: string,
  deps: PostAssetMutationDeps,
): Promise<void> {
  const post = deps.posts.findById(postId);
  if (!post) {
    throw new AssetIngestError("post not found", 404);
  }

  const asset = deps.assets.findById(assetId);
  if (!asset || asset.postId !== postId) {
    throw new AssetIngestError("asset not found", 404);
  }

  const filename = filenameFromStoragePath(asset.storagePath);
  await deps.mediaStorage.delete(postId, filename);
  deps.assets.deleteById(assetId);
}

export function reorderPostAssets(
  postId: string,
  assetIds: string[],
  deps: PostAssetMutationDeps,
): PostAsset[] {
  const post = deps.posts.findById(postId);
  if (!post) {
    throw new AssetIngestError("post not found", 404);
  }

  const current = deps.assets.listByPostId(postId);
  if (assetIds.length !== current.length) {
    throw new ValidationError("asset_ids must include every asset for the post");
  }

  const knownIds = new Set(current.map((asset) => asset.id));
  const uniqueIds = new Set(assetIds);
  if (uniqueIds.size !== assetIds.length) {
    throw new ValidationError("asset_ids must not contain duplicates");
  }

  for (const assetId of assetIds) {
    if (!knownIds.has(assetId)) {
      throw new ValidationError("asset_ids contains unknown asset");
    }
  }

  return deps.assets.reorder(postId, assetIds);
}
