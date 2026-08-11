import type { MetaTokenStore } from "../../ports/meta-token-store.ts";
import type {
  MetaCommentReader,
  RemoteComment,
  RemoteMediaWithComments,
} from "../../ports/meta-comment-reader.ts";
import { normalizeCommentTimestamp } from "../../domain/comments/normalize-comment-timestamp.ts";
import { normalizeInstagramPermalink } from "../../domain/comments/parse-instagram-media-input.ts";

export type GraphApiCommentReaderConfig = {
  resolveIgUserId: () => string | null;
  graphApiVersion?: string;
  fetchImpl?: typeof fetch;
};

type GraphApiCommentReaderDeps = {
  metaTokenStore: MetaTokenStore;
  config: GraphApiCommentReaderConfig;
};

type GraphPaging<T> = {
  data?: T[];
  paging?: {
    next?: string;
    cursors?: { before?: string; after?: string };
  };
  error?: { message?: string; code?: number };
};

type GraphMedia = {
  id?: string;
  caption?: string;
  timestamp?: string;
  comments_count?: number;
  like_count?: number;
  permalink?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  children?: GraphPaging<GraphMedia>;
};

type GraphComment = {
  id?: string;
  text?: string;
  username?: string;
  from?: { username?: string };
  timestamp?: string;
  parent_id?: string;
  replies?: GraphPaging<GraphComment>;
};

const MEDIA_FIELDS = "id,caption,timestamp,comments_count,like_count";
const MEDIA_LOOKUP_FIELDS = "id,caption,timestamp,permalink,like_count,comments_count";
const MEDIA_PREVIEW_FIELDS =
  "id,caption,timestamp,permalink,media_type,media_url,thumbnail_url";
const MEDIA_CAROUSEL_FIELDS =
  "id,permalink,media_type,media_url,thumbnail_url,children{media_type,media_url,thumbnail_url}";
const MEDIA_BROWSE_FIELDS =
  "id,caption,timestamp,permalink,media_type,media_url,thumbnail_url,like_count,comments_count";
const COMMENT_FIELDS =
  "id,text,from{username},timestamp,parent_id,replies{id,text,from{username},timestamp,parent_id}";

export function createGraphApiCommentReader(
  deps: GraphApiCommentReaderDeps,
): MetaCommentReader {
  const fetchFn = deps.config.fetchImpl ?? fetch;
  const version = deps.config.graphApiVersion ?? "v21.0";
  const base = `https://graph.instagram.com/${version}`;

  async function fetchGraph<T>(url: string): Promise<T> {
    const response = await fetchFn(url);
    const json = (await response.json()) as T & { error?: { message?: string } };

    if (!response.ok || (json as { error?: { message?: string } }).error) {
      throw new Error(
        (json as { error?: { message?: string } }).error?.message ??
          `Meta API error (${response.status})`,
      );
    }

    return json;
  }

  async function fetchAllPages<T>(initialUrl: string): Promise<T[]> {
    const items: T[] = [];
    let nextUrl: string | null = initialUrl;

    while (nextUrl) {
      const page = await fetchGraph<GraphPaging<T>>(nextUrl);
      if (page.data?.length) {
        items.push(...page.data);
      }
      nextUrl = page.paging?.next ?? null;
    }

    return items;
  }

  function flattenComments(comments: GraphComment[], parentId: string | null = null): RemoteComment[] {
    const flattened: RemoteComment[] = [];
    const seen = new Set<string>();

    function walk(items: GraphComment[], walkParentId: string | null): void {
      for (const comment of items) {
        if (!comment.id || seen.has(comment.id)) {
          continue;
        }

        seen.add(comment.id);

        const from =
          comment.from && typeof comment.from === "object"
            ? (comment.from as { username?: string })
            : null;

        flattened.push({
          igCommentId: comment.id,
          parentIgCommentId: comment.parent_id ?? walkParentId,
          authorUsername: from?.username ?? comment.username ?? null,
          text: comment.text ?? null,
          timestamp: normalizeCommentTimestamp(comment.timestamp),
        });

        if (comment.replies?.data?.length) {
          walk(comment.replies.data, comment.id);
        }
      }
    }

    walk(comments, parentId);
    return flattened;
  }

  async function fetchMediaWithComments(
    media: GraphMedia,
    token: string,
  ): Promise<RemoteMediaWithComments | null> {
    if (!media.id) {
      return null;
    }

    const commentsUrl = new URL(`${base}/${media.id}/comments`);
    commentsUrl.searchParams.set("fields", COMMENT_FIELDS);
    commentsUrl.searchParams.set("access_token", token);

    const commentItems = await fetchAllPages<GraphComment>(commentsUrl.toString());
    const comments = flattenComments(commentItems);

    return {
      igMediaId: media.id,
      caption: media.caption ?? null,
      timestamp: media.timestamp ?? new Date().toISOString(),
      reportedCommentsCount: Number(media.comments_count ?? 0),
      likeCount: typeof media.like_count === "number" ? media.like_count : null,
      comments,
    };
  }

  function mapMediaMetadata(media: GraphMedia) {
    return {
      igMediaId: media.id!,
      caption: media.caption ?? null,
      timestamp: media.timestamp ?? null,
      permalink: media.permalink ?? null,
      mediaType: media.media_type ?? null,
      mediaUrl: media.media_url ?? null,
      thumbnailUrl: media.thumbnail_url ?? null,
      likeCount: typeof media.like_count === "number" ? media.like_count : null,
      commentsCount:
        typeof media.comments_count === "number" ? media.comments_count : null,
    };
  }

  function mapMediaSlide(media: GraphMedia) {
    const url = media.media_url ?? media.thumbnail_url;
    if (!url) {
      return null;
    }

    return {
      url,
      mediaType: media.media_type ?? null,
      thumbnailUrl: media.thumbnail_url ?? null,
    };
  }

  function extractMediaSlides(media: GraphMedia) {
    const childSlides = (media.children?.data ?? [])
      .map((child) => mapMediaSlide(child))
      .filter((slide): slide is NonNullable<typeof slide> => Boolean(slide));

    if (childSlides.length > 0) {
      return childSlides;
    }

    const rootSlide = mapMediaSlide(media);
    return rootSlide ? [rootSlide] : [];
  }

  function mapMediaPreview(media: GraphMedia) {
    return {
      permalink: media.permalink ?? null,
      mediaType: media.media_type ?? null,
      slides: extractMediaSlides(media),
    };
  }

  function mapBrowsableMedia(media: GraphMedia) {
    if (!media.id) {
      return null;
    }

    return {
      igMediaId: media.id,
      caption: media.caption ?? null,
      timestamp: media.timestamp ?? null,
      permalink: media.permalink ?? null,
      mediaType: media.media_type ?? null,
      thumbnailUrl: media.thumbnail_url ?? media.media_url ?? null,
      likeCount: typeof media.like_count === "number" ? media.like_count : null,
      commentsCount:
        typeof media.comments_count === "number" ? media.comments_count : null,
    };
  }

  async function fetchMediaNode(igMediaId: string, fields: string, token: string) {
    const mediaUrl = new URL(`${base}/${igMediaId}`);
    mediaUrl.searchParams.set("fields", fields);
    mediaUrl.searchParams.set("access_token", token);
    return fetchGraph<GraphMedia>(mediaUrl.toString());
  }

  return {
    async listRecentMediaWithComments(
      since: Date,
      options?: { igMediaId?: string },
    ): Promise<RemoteMediaWithComments[]> {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw new Error("Meta access token not configured");
      }

      if (options?.igMediaId) {
        const mediaUrl = new URL(`${base}/${options.igMediaId}`);
        mediaUrl.searchParams.set("fields", MEDIA_FIELDS);
        mediaUrl.searchParams.set("access_token", token);

        const media = await fetchGraph<GraphMedia>(mediaUrl.toString());
        if (Number(media.comments_count ?? 0) === 0) {
          return [];
        }

        const result = await fetchMediaWithComments(media, token);
        return result ? [result] : [];
      }

      if (options?.igMediaIds?.length) {
        const results: RemoteMediaWithComments[] = [];

        for (const mediaId of options.igMediaIds) {
          const mediaUrl = new URL(`${base}/${mediaId}`);
          mediaUrl.searchParams.set("fields", MEDIA_FIELDS);
          mediaUrl.searchParams.set("access_token", token);

          const media = await fetchGraph<GraphMedia>(mediaUrl.toString());
          if (Number(media.comments_count ?? 0) === 0) {
            continue;
          }

          const result = await fetchMediaWithComments(media, token);
          if (result) {
            results.push(result);
          }
        }

        return results;
      }

      const igUserId = deps.config.resolveIgUserId();
      if (!igUserId) {
        throw new Error("IG user id not configured");
      }

      const mediaUrl = new URL(`${base}/me/media`);
      mediaUrl.searchParams.set("fields", MEDIA_FIELDS);
      mediaUrl.searchParams.set("access_token", token);

      const mediaItems = await fetchAllPages<GraphMedia>(mediaUrl.toString());
      const sinceMs = since.getTime();
      const recentMedia = mediaItems.filter((item) => {
        if (!item.id || !item.timestamp) {
          return false;
        }

        if (Number(item.comments_count ?? 0) === 0) {
          return false;
        }

        return Date.parse(item.timestamp) >= sinceMs;
      });

      const results: RemoteMediaWithComments[] = [];

      for (const media of recentMedia) {
        const result = await fetchMediaWithComments(media, token);
        if (result) {
          results.push(result);
        }
      }

      return results;
    },

    async fetchMediaMetadata(igMediaId: string) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw new Error("Meta access token not configured");
      }

      try {
        const media = await fetchMediaNode(igMediaId, MEDIA_PREVIEW_FIELDS, token);
        if (!media.id) {
          throw new Error("media not found");
        }
        return mapMediaMetadata(media);
      } catch {
        const media = await fetchMediaNode(
          igMediaId,
          "id,caption,timestamp,permalink,media_url,media_type",
          token,
        );
        if (!media.id) {
          throw new Error("media not found");
        }
        return mapMediaMetadata(media);
      }
    },

    async fetchMediaPreview(igMediaId: string) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw new Error("Meta access token not configured");
      }

      try {
        const media = await fetchMediaNode(igMediaId, MEDIA_CAROUSEL_FIELDS, token);
        if (!media.id) {
          throw new Error("media not found");
        }
        return mapMediaPreview(media);
      } catch {
        const media = await fetchMediaNode(
          igMediaId,
          "id,permalink,media_type,media_url,thumbnail_url",
          token,
        );
        if (!media.id) {
          throw new Error("media not found");
        }
        return mapMediaPreview(media);
      }
    },

    async listBrowsableMedia(options) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw new Error("Meta access token not configured");
      }

      const limit = Math.min(Math.max(options?.limit ?? 20, 1), 50);
      const mediaUrl = new URL(`${base}/me/media`);
      mediaUrl.searchParams.set("fields", MEDIA_BROWSE_FIELDS);
      mediaUrl.searchParams.set("limit", String(limit));
      mediaUrl.searchParams.set("access_token", token);

      if (options?.after) {
        mediaUrl.searchParams.set("after", options.after);
      }

      const page = await fetchGraph<GraphPaging<GraphMedia>>(mediaUrl.toString());
      const items = (page.data ?? [])
        .map((media) => mapBrowsableMedia(media))
        .filter((media): media is NonNullable<typeof media> => Boolean(media));

      return {
        items,
        nextCursor: page.paging?.cursors?.after ?? null,
      };
    },

    async findMediaByPermalink(permalink: string) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw new Error("Meta access token not configured");
      }

      const igUserId = deps.config.resolveIgUserId();
      if (!igUserId) {
        throw new Error("IG user id not configured");
      }

      const target = normalizeInstagramPermalink(permalink);
      const mediaUrl = new URL(`${base}/${igUserId}/media`);
      mediaUrl.searchParams.set("fields", MEDIA_LOOKUP_FIELDS);
      mediaUrl.searchParams.set("access_token", token);

      const mediaItems = await fetchAllPages<GraphMedia>(mediaUrl.toString());

      for (const media of mediaItems) {
        if (!media.id || !media.permalink) {
          continue;
        }

        try {
          if (normalizeInstagramPermalink(media.permalink) === target) {
            return {
              igMediaId: media.id,
              caption: media.caption ?? null,
              timestamp: media.timestamp ?? null,
            };
          }
        } catch {
          continue;
        }
      }

      return null;
    },

    async isMediaOnUserFeed(igMediaId: string) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw new Error("Meta access token not configured");
      }

      const mediaUrl = new URL(`${base}/me/media`);
      mediaUrl.searchParams.set("fields", "id");
      mediaUrl.searchParams.set("access_token", token);

      let nextUrl: string | null = mediaUrl.toString();

      while (nextUrl) {
        const page = await fetchGraph<GraphPaging<GraphMedia>>(nextUrl);
        for (const item of page.data ?? []) {
          if (item.id === igMediaId) {
            return true;
          }
        }
        nextUrl = page.paging?.next ?? null;
      }

      return false;
    },

    async canAccessMediaComments(igMediaId: string) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw new Error("Meta access token not configured");
      }

      const commentsUrl = new URL(`${base}/${igMediaId}/comments`);
      commentsUrl.searchParams.set("fields", "id");
      commentsUrl.searchParams.set("limit", "1");
      commentsUrl.searchParams.set("access_token", token);

      try {
        await fetchGraph<GraphPaging<GraphComment>>(commentsUrl.toString());
        return true;
      } catch {
        return false;
      }
    },

    async fetchCommentTimestamp(igCommentId: string) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        return null;
      }

      const commentUrl = new URL(`${base}/${igCommentId}`);
      commentUrl.searchParams.set("fields", "timestamp");
      commentUrl.searchParams.set("access_token", token);

      const comment = await fetchGraph<{ timestamp?: string }>(commentUrl.toString());
      return normalizeCommentTimestamp(comment.timestamp);
    },
  };
}
