import type { CommentPostSummary, PostInsightsMedia, PostMediaSlide } from "@/lib/types";

export function localAssetUrl(postId: string, filename: string): string {
  return `/api/posts/${encodeURIComponent(postId)}/assets/${encodeURIComponent(filename)}`;
}

export function postPreviewUrl(post: CommentPostSummary): string | null {
  if (!post.preview_filename) {
    return null;
  }
  return localAssetUrl(post.post_id, post.preview_filename);
}

export function resolveMediaSlideSrc(postId: string, slide: PostMediaSlide): string {
  if (slide.source === "local") {
    return localAssetUrl(postId, slide.preview_filename);
  }
  return slide.url;
}

export function resolveMediaSlides(
  postId: string,
  media: PostInsightsMedia | undefined,
): Array<{ src: string; mediaType: string | null }> {
  if (!media?.items?.length) {
    return [];
  }

  return media.items.map((slide) => ({
    src: resolveMediaSlideSrc(postId, slide),
    mediaType:
      slide.source === "local"
        ? slide.preview_mime?.startsWith("video/")
          ? "VIDEO"
          : "IMAGE"
        : slide.media_type ?? null,
  }));
}

export function firstMediaSlideSrc(
  postId: string,
  media: PostInsightsMedia | undefined,
): string | null {
  const slides = resolveMediaSlides(postId, media);
  return slides[0]?.src ?? null;
}

/** @deprecated use firstMediaSlideSrc */
export function insightsMediaPreviewUrl(
  postId: string,
  media: PostInsightsMedia | undefined,
): string | null {
  return firstMediaSlideSrc(postId, media);
}
