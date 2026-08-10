import type { MediaStorage } from "../../ports/media-storage.ts";
import type { PostMediaSlide } from "../post-media/resolve-post-media.ts";

/** Remote carousel slides are fetched into memory only — never written to disk. */
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export type SlideImagePayload = {
  mime: string;
  base64: string;
};

export type ResolveSlideImageDeps = {
  postId: string;
  mediaStorage?: MediaStorage | null;
  publicBaseUrl?: string | null;
  fetchImpl?: typeof fetch;
};

function absolutizeImageUrl(
  url: string,
  publicBaseUrl: string | null | undefined,
): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("/") && publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, "")}${url}`;
  }

  return url;
}

function normalizeMime(mime: string | null | undefined): string | null {
  const normalized = mime?.split(";")[0]?.trim().toLowerCase();
  if (!normalized || !normalized.startsWith("image/")) {
    return null;
  }

  return normalized;
}

export async function resolveSlideImage(
  slide: PostMediaSlide,
  deps: ResolveSlideImageDeps,
): Promise<SlideImagePayload | null> {
  if (slide.source === "local" && slide.previewFilename && deps.mediaStorage) {
    const file = await deps.mediaStorage.read(deps.postId, slide.previewFilename);
    if (file && file.buffer.byteLength > 0 && file.buffer.byteLength <= MAX_IMAGE_BYTES) {
      const mime = normalizeMime(slide.previewMime ?? file.mime) ?? "image/jpeg";
      return {
        mime,
        base64: file.buffer.toString("base64"),
      };
    }
  }

  const fetchFn = deps.fetchImpl ?? fetch;
  const url = absolutizeImageUrl(slide.url, deps.publicBaseUrl);
  if (!/^https?:\/\//i.test(url)) {
    return null;
  }

  try {
    const response = await fetchFn(url);
    if (!response.ok) {
      return null;
    }

    // In-memory only; buffers are released after the LLM request completes.
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
      return null;
    }

    const mime =
      normalizeMime(slide.previewMime ?? response.headers.get("content-type")) ??
      "image/jpeg";

    return {
      mime,
      base64: buffer.toString("base64"),
    };
  } catch {
    return null;
  }
}
