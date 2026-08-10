import { ValidationError } from "../../api/json.ts";

export type ParsedInstagramMediaInput = {
  igMediaId: string;
};

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
    const segments = url.pathname.split("/").filter(Boolean);
    const numericSegment = segments.find((segment) => /^\d{5,}$/.test(segment));
    if (numericSegment) {
      return { igMediaId: numericSegment };
    }
  } catch {
    // fall through to validation error
  }

  throw new ValidationError(
    "permalink must include a numeric Meta media id, or pass ig_media_id directly",
  );
}
