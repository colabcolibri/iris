import { ValidationError } from "../../api/json.ts";

export type ParsedInstagramMediaInput = {
  igMediaId: string;
};

const SHORTCODE_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const SHORTCODE_PATH_PREFIXES = new Set(["p", "reel", "reels", "tv"]);

export function instagramShortcodeToMediaId(shortcode: string): string {
  const normalized = shortcode.trim();
  if (!normalized) {
    throw new ValidationError("Instagram shortcode is empty");
  }

  let id = 0n;

  for (const char of normalized) {
    const index = SHORTCODE_ALPHABET.indexOf(char);
    if (index < 0) {
      throw new ValidationError(`invalid Instagram shortcode: ${normalized}`);
    }

    id = id * 64n + BigInt(index);
  }

  return id.toString();
}

export function extractInstagramShortcodeFromUrl(url: URL): string | null {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    return null;
  }

  const prefix = segments[0]?.toLowerCase();
  if (!prefix || !SHORTCODE_PATH_PREFIXES.has(prefix)) {
    return null;
  }

  const shortcode = segments[1]?.split("?")[0]?.trim();
  if (!shortcode || /^\d+$/.test(shortcode)) {
    return null;
  }

  return shortcode;
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

    return { igMediaId: rawId };
  }

  if (!rawPermalink) {
    throw new ValidationError("ig_media_id or permalink is required");
  }

  const directNumeric = rawPermalink.replace(/\s+/g, "");
  if (/^\d{5,}$/.test(directNumeric)) {
    return { igMediaId: directNumeric };
  }

  try {
    const url = new URL(
      rawPermalink.startsWith("http")
        ? rawPermalink
        : `https://${rawPermalink}`,
    );

    const numericSegment = url.pathname
      .split("/")
      .find((segment) => /^\d{5,}$/.test(segment));
    if (numericSegment) {
      return { igMediaId: numericSegment };
    }

    const shortcode = extractInstagramShortcodeFromUrl(url);
    if (shortcode) {
      return { igMediaId: instagramShortcodeToMediaId(shortcode) };
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    // fall through to validation error
  }

  throw new ValidationError(
    "permalink must be a valid Instagram post/reel URL, or pass ig_media_id directly",
  );
}
