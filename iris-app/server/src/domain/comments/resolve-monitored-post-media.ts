import type { MetaCommentReader, RemoteMediaMetadata } from "../../ports/meta-comment-reader.ts";
import type { ParsedInstagramMediaInput } from "./parse-instagram-media-input.ts";
import { ValidationError } from "../../api/json.ts";

export async function resolveMonitoredPostMedia(
  parsed: ParsedInstagramMediaInput,
  reader: MetaCommentReader,
): Promise<RemoteMediaMetadata> {
  if (parsed.permalink) {
    const fromPermalink = await reader.findMediaByPermalink(parsed.permalink);
    if (fromPermalink) {
      return fromPermalink;
    }
  }

  if (parsed.igMediaId) {
    return reader.fetchMediaMetadata(parsed.igMediaId);
  }

  throw new ValidationError(
    "post not found on the connected Instagram account; verify the link belongs to this account",
  );
}
