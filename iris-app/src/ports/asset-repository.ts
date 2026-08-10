import type { PostAsset } from "../domain/post.ts";

export type CreateAssetInput = {
  postId: string;
  sortOrder: number;
  storagePath: string;
  originalFilename?: string | null;
  mime: string;
  width?: number | null;
  height?: number | null;
  originalSizeBytes?: number | null;
  optimizedSizeBytes?: number | null;
};

export type AssetRepository = {
  create(input: CreateAssetInput): PostAsset;
  listByPostId(postId: string): PostAsset[];
  findById(id: string): PostAsset | null;
  findByPostIdAndFilename(postId: string, filename: string): PostAsset | null;
  deleteById(id: string): boolean;
  reorder(postId: string, orderedAssetIds: string[]): PostAsset[];
};
