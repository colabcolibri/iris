import { ValidationError } from "../../api/json.ts";

export type ParsedInstagramMediaInput = {
  igMediaId: string | null;
  permalink: string | null;
};

const PERMALINK_PATH_PREFIXES = new Set(["p", "reel", "reels", "tv"]);

export function normalizeInstagramPermalink(input: string): string {
  const url = new URL(input.startsWith("http") ? input : `https://${input}`);
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length < 2) {
    throw new ValidationError("permalink must include an Instagram post or reel path");
  }

  const prefix = segments[0]?.toLowerCase();
  const shortcode = segments[1]?.trim();

  if (!prefix || !shortcode || !PERMALINK_PATH_PREFIXES.has(prefix)) {
    throw new ValidationError("permalink must be a valid Instagram post/reel URL");
  }

  const normalizedPrefix = prefix === "reels" ? "reel" : prefix;
  return `https://www.instagram.com/${normalizedPrefix}/${shortcode}/`;
}

export function parseInstagramMediaInput(input: {
  ig_media_id?: unknown;
  permalink?: unknown;
}): ParsedInstagramMediaInput {
  const rawId =
    typeof input.ig_media_id === "string" ? input.ig_media_id.trim() : "";
  const rawPermalink =
    typeof input.permalink === "string" ? input.permalink.trim() : "";

  if (rawId) {
    if (!/^\d{5,}$/.test(rawId)) {
      throw new ValidationError("ig_media_id must be a numeric Meta media id");
    }

    return { igMediaId: rawId, permalink: null };
  }

  if (!rawPermalink) {
    throw new ValidationError("ig_media_id or permalink is required");
  }

  const directNumeric = rawPermalink.replace(/\s+/g, "");
  if (/^\d{5,}$/.test(directNumeric)) {
    return { igMediaId: directNumeric, permalink: null };
  }

  return {
    igMediaId: null,
    permalink: normalizeInstagramPermalink(rawPermalink),
  };
}
