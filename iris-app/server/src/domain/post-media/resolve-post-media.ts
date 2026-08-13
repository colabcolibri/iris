import type { AssetRepository } from "../../ports/asset-repository.ts";
import type { MetaCommentReader } from "../../ports/meta-comment-reader.ts";
import type { PostRepository } from "../../ports/post-repository.ts";
import {
  buildPublishImageUrl,
  filenameFromStoragePath,
} from "../posts/publish-url.ts";

export type PostMediaSlide = {
  source: "local" | "meta";
  sortOrder: number;
  url: string;
  mediaType: string | null;
  previewFilename?: string;
  previewMime?: string;
  thumbnailUrl?: string | null;
};

export type ResolvedPostMedia = {
  source: "local" | "meta" | "none";
  permalink: string | null;
  mediaType: string | null;
  slides: PostMediaSlide[];
};

export type ResolvePostMediaDeps = {
  posts: PostRepository;
  assets: AssetRepository;
  metaCommentReader?: MetaCommentReader | null;
  publicBaseUrl?: string | null;
  publishUrlSecret?: string | null;
};

function mapLocalSlides(
  postId: string,
  deps: ResolvePostMediaDeps,
): PostMediaSlide[] {
  const canBuildUrl =
    Boolean(deps.publicBaseUrl) && Boolean(deps.publishUrlSecret);

  return deps.assets.listByPostId(postId).map((asset) => {
    const previewFilename = filenameFromStoragePath(asset.storagePath);
    const publishUrl =
      canBuildUrl && deps.publicBaseUrl && deps.publishUrlSecret
        ? buildPublishImageUrl(
            postId,
            previewFilename,
            deps.publicBaseUrl,
            deps.publishUrlSecret,
          )
        : null;

    return {
      source: "local" as const,
      sortOrder: asset.sortOrder,
      url: publishUrl ?? `/api/posts/${postId}/assets/${encodeURIComponent(previewFilename)}`,
      mediaType: asset.mime?.startsWith("video/") ? "VIDEO" : "IMAGE",
      previewFilename,
      previewMime: asset.mime,
      thumbnailUrl: null,
    };
  });
}

function mapMetaSlides(
  slides: Array<{
    url: string;
    mediaType: string | null;
    thumbnailUrl: string | null;
  }>,
): PostMediaSlide[] {
  return slides.map((slide, index) => ({
    source: "meta" as const,
    sortOrder: index + 1,
    url: slide.url,
    mediaType: slide.mediaType,
    thumbnailUrl: slide.thumbnailUrl,
  }));
}

export async function resolvePostMedia(
  postId: string,
  deps: ResolvePostMediaDeps,
): Promise<ResolvedPostMedia> {
  const post = deps.posts.findById(postId);
  if (!post) {
    return { source: "none", permalink: null, mediaType: null, slides: [] };
  }

  const localSlides = mapLocalSlides(postId, deps);
  if (localSlides.length > 0) {
    return {
      source: "local",
      permalink: null,
      mediaType: localSlides[0]?.mediaType ?? null,
      slides: localSlides,
    };
  }

  if (!post.igMediaId || !deps.metaCommentReader) {
    return { source: "none", permalink: null, mediaType: null, slides: [] };
  }

  try {
    const remote = await deps.metaCommentReader.fetchMediaPreview(post.igMediaId);
    const slides = mapMetaSlides(remote.slides);

    return {
      source: slides.length > 0 ? "meta" : "none",
      permalink: remote.permalink,
      mediaType: remote.mediaType,
      slides,
    };
  } catch {
    return { source: "none", permalink: null, mediaType: null, slides: [] };
  }
}

export function firstPostMediaUrl(media: ResolvedPostMedia): string | null {
  const first = media.slides[0];
  if (!first) {
    return null;
  }

  return first.thumbnailUrl ?? first.url;
}

export type PostInboxPreview = {
  previewUrl: string | null;
  previewFilename: string | null;
  previewMime: string | null;
};

function localInboxPreview(
  postId: string,
  deps: ResolvePostMediaDeps,
): PostInboxPreview {
  const firstAsset = deps.assets.listByPostId(postId)[0];
  const previewFilename = firstAsset
    ? filenameFromStoragePath(firstAsset.storagePath)
    : null;

  return {
    previewUrl: previewFilename
      ? `/api/posts/${postId}/assets/${encodeURIComponent(previewFilename)}`
      : null,
    previewFilename,
    previewMime: firstAsset?.mime ?? null,
  };
}

/**
 * Thumbnail for the comments inbox grid. When Meta is connected, prefers the live
 * IG CDN URL so the grid does not depend on local asset files. Falls back to local
 * assets when Meta is unavailable or the fetch fails.
 */
export async function resolvePostInboxPreview(
  postId: string,
  igMediaId: string | null | undefined,
  deps: ResolvePostMediaDeps,
  options: { preferMeta?: boolean } = {},
): Promise<PostInboxPreview> {
  const local = localInboxPreview(postId, deps);

  if (!options.preferMeta || !igMediaId || !deps.metaCommentReader) {
    return local;
  }

  try {
    const remote = await deps.metaCommentReader.fetchMediaPreview(igMediaId);
    const firstSlide = remote.slides[0];
    const metaUrl = firstSlide?.thumbnailUrl ?? firstSlide?.url ?? null;
    if (metaUrl) {
      return {
        previewUrl: metaUrl,
        previewFilename: local.previewFilename,
        previewMime: local.previewMime,
      };
    }
  } catch {
    // keep local fallback
  }

  return local;
}
