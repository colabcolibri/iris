import type { Asset, AssetRepository } from "../ports/asset-repository.ts";
import type { ImageOptimizer } from "../ports/image-optimizer.ts";
import type { MediaStorage } from "../ports/media-storage.ts";
import type { PostRepository } from "../ports/post-repository.ts";
import { getImageLimits } from "./image-limits.ts";
import { ImageOptimizationError } from "../ports/image-optimizer.ts";

export class AssetIngestError extends Error {
  status: number;

  constructor(message: string, status = 422) {
    super(message);
    this.name = "AssetIngestError";
    this.status = status;
  }
}

export type AssetIngestDeps = {
  posts: PostRepository;
  assets: AssetRepository;
  mediaStorage: MediaStorage;
  imageOptimizer: ImageOptimizer;
};

export type AssetIngestInput = {
  postId: string;
  buffer: Buffer;
  filename: string;
  mime?: string;
  sortOrder: number;
};

export async function ingestPostAsset(
  deps: AssetIngestDeps,
  input: AssetIngestInput,
): Promise<Asset> {
  const post = deps.posts.findById(input.postId);
  if (!post) {
    throw new AssetIngestError("post not found", 404);
  }

  if (!Number.isFinite(input.sortOrder) || input.sortOrder < 1) {
    throw new AssetIngestError("sort_order must be a positive integer");
  }

  const limits = getImageLimits();
  if (input.buffer.length > limits.uploadMaxBytes) {
    throw new AssetIngestError("file too large", 413);
  }

  let optimized;
  try {
    optimized = await deps.imageOptimizer.optimize(input.buffer, input.filename);
  } catch (error) {
    if (error instanceof ImageOptimizationError) {
      throw new AssetIngestError(error.message, error.status);
    }
    throw error;
  }

  const storagePath = await deps.mediaStorage.write(
    input.postId,
    input.sortOrder,
    optimized.buffer,
  );

  return deps.assets.create({
    postId: input.postId,
    sortOrder: input.sortOrder,
    storagePath,
    originalFilename: input.filename,
    mime: optimized.mime,
    width: optimized.width,
    height: optimized.height,
    originalSizeBytes: optimized.originalSizeBytes,
    optimizedSizeBytes: optimized.optimizedSizeBytes,
  });
}
