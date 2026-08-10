import type { ResolvedPostMedia } from "./resolve-post-media.ts";

export type SerializedPostMediaItem =
  | {
      source: "local";
      preview_filename: string;
      preview_mime: string;
    }
  | {
      source: "meta";
      url: string;
      media_type: string | null;
      thumbnail_url: string | null;
    };

export type SerializedPostMedia = {
  source: "local" | "meta";
  permalink: string | null;
  media_type: string | null;
  items: SerializedPostMediaItem[];
};

export function serializePostMedia(media: ResolvedPostMedia): SerializedPostMedia | null {
  if (media.slides.length === 0 || media.source === "none") {
    return null;
  }

  return {
    source: media.source,
    permalink: media.permalink,
    media_type: media.mediaType,
    items: media.slides.map((slide) => {
      if (slide.source === "local") {
        return {
          source: "local" as const,
          preview_filename: slide.previewFilename ?? "",
          preview_mime: slide.previewMime ?? "image/jpeg",
        };
      }

      return {
        source: "meta" as const,
        url: slide.url,
        media_type: slide.mediaType,
        thumbnail_url: slide.thumbnailUrl ?? null,
      };
    }),
  };
}
