import type { MetaCommentReader } from "../../ports/meta-comment-reader.ts";
import {
  humanizeMetaMediaError,
  type IgMediaAvailability,
} from "./ig-media-status.ts";

export type IgMediaAvailabilityProbe = Pick<
  MetaCommentReader,
  "fetchMediaMetadata" | "isMediaOnUserFeed" | "canAccessMediaComments"
>;

export async function probeIgMediaAvailability(
  reader: IgMediaAvailabilityProbe,
  igMediaId: string,
): Promise<IgMediaAvailability> {
  let metadataError: string | null = null;

  try {
    await reader.fetchMediaMetadata(igMediaId);
  } catch (error) {
    metadataError =
      error instanceof Error ? error.message : "Falha ao consultar mídia na Meta.";
  }

  if (!metadataError) {
    const onFeed = await reader.isMediaOnUserFeed(igMediaId);
    if (!onFeed) {
      return {
        status: "archived",
        detail:
          "A publicação existe na Meta, mas não aparece no feed do Instagram (provável arquivada).",
      };
    }

    return {
      status: "on_feed",
      detail: null,
    };
  }

  const commentsAccessible = await reader.canAccessMediaComments(igMediaId);
  if (commentsAccessible) {
    return {
      status: "archived",
      detail:
        "A publicação parece arquivada no Instagram: a Iris ainda acessa comentários, mas a mídia não está no feed.",
    };
  }

  return {
    status: "unavailable",
    detail: humanizeMetaMediaError(metadataError),
  };
}
