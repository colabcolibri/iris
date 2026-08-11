import type { AssetRepository } from "../../ports/asset-repository.ts";
import type { PostRepository } from "../../ports/post-repository.ts";
import {
  buildPublishImageUrl,
  filenameFromStoragePath,
} from "../publish-url.ts";
import type { PostReplyContext } from "./post-context.ts";

export type BuildPostReplyContextDeps = {
  posts: PostRepository;
  assets: AssetRepository;
  publicBaseUrl: string | null;
  publishUrlSecret: string | null;
};

export function buildPostReplyContext(
  postId: string,
  deps: BuildPostReplyContextDeps,
): PostReplyContext | null {
  const post = deps.posts.findById(postId);
  if (!post) {
    return null;
  }

  const assetRows = deps.assets.listByPostId(postId);
  const canBuildUrl =
    Boolean(deps.publicBaseUrl) && Boolean(deps.publishUrlSecret);

  const assets = assetRows.map((asset) => {
    const filename = filenameFromStoragePath(asset.storagePath);
    const publishUrl =
      canBuildUrl && deps.publicBaseUrl && deps.publishUrlSecret
        ? buildPublishImageUrl(
            postId,
            filename,
            deps.publicBaseUrl,
            deps.publishUrlSecret,
          )
        : null;

    return {
      filename,
      sortOrder: asset.sortOrder,
      mime: asset.mime,
      width: asset.width ?? null,
      height: asset.height ?? null,
      publishUrl,
    };
  });

  return {
    postId: post.id,
    caption: post.caption,
    carouselSummary: post.carouselSummary,
    channel: post.channel,
    status: post.status,
    scheduledAt: post.scheduledAt,
    publishedAt: post.publishedAt,
    assets,
  };
}
