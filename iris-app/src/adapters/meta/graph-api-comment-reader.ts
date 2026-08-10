import type { MetaTokenStore } from "../../ports/meta-token-store.ts";
import type {
  MetaCommentReader,
  RemoteComment,
  RemoteMediaWithComments,
} from "../../ports/meta-comment-reader.ts";

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
  paging?: { next?: string };
  error?: { message?: string; code?: number };
};

type GraphMedia = {
  id?: string;
  caption?: string;
  timestamp?: string;
  comments_count?: number;
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

const MEDIA_FIELDS = "id,caption,timestamp,comments_count";
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

    for (const comment of comments) {
      if (!comment.id) {
        continue;
      }

      const from =
        comment.from && typeof comment.from === "object"
          ? (comment.from as { username?: string })
          : null;

      flattened.push({
        igCommentId: comment.id,
        parentIgCommentId: comment.parent_id ?? parentId,
        authorUsername: from?.username ?? comment.username ?? null,
        text: comment.text ?? null,
        timestamp: comment.timestamp ?? new Date().toISOString(),
      });

      if (comment.replies?.data?.length) {
        flattened.push(...flattenComments(comment.replies.data, comment.id));
      }
    }

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
      comments,
    };
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
  };
}
