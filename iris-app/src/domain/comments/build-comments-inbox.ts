import type { MetaCommentReader } from "../../ports/meta-comment-reader.ts";

export type InboxComment = {
  igCommentId: string;
  parentIgCommentId: string | null;
  authorUsername: string | null;
  text: string | null;
  timestamp: string;
  irisCommentId: string | null;
  status: string | null;
};

export type InboxMedia = {
  igMediaId: string;
  postId: string | null;
  caption: string | null;
  mediaTimestamp: string;
  reportedCommentsCount: number;
  comments: InboxComment[];
};

export type CommentsInbox = {
  source: "local" | "meta";
  syncedAt: string;
  days: number;
  media: InboxMedia[];
  summary: {
    media_scanned: number;
    comments_reported: number;
    comments_fetched: number;
    access_limited: boolean;
    warning: string | null;
  };
};

export type LocalInboxPost = {
  id: string;
  igMediaId: string;
  caption: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
};

export type LocalInboxComment = {
  id: string;
  igCommentId: string;
  parentIgCommentId: string | null;
  authorUsername: string | null;
  text: string | null;
  status: string;
  createdAt: string;
};

export type BuildCommentsInboxDeps = {
  metaCommentReader: MetaCommentReader;
  findPostIdByIgMediaId: (igMediaId: string) => string | null;
  listIrisPostsSince: (since: Date) => LocalInboxPost[];
  listCommentsByPostId: (postId: string) => LocalInboxComment[];
  upsertFromWebhook: (input: {
    igCommentId: string;
    postId: string;
    parentIgCommentId?: string | null;
    authorUsername?: string | null;
    text?: string | null;
  }) => { comment: { id: string; status: string } };
  findByIgCommentId: (igCommentId: string) => { id: string; status: string } | null;
};

export type BuildCommentsInboxOptions = {
  igMediaId?: string;
  /** iris = só posts publicados pelo Iris; all = varre a conta inteira na Meta. */
  scope?: "iris" | "all";
};

export function buildLocalCommentsInbox(
  days: number,
  deps: Pick<
    BuildCommentsInboxDeps,
    "listIrisPostsSince" | "listCommentsByPostId" | "findPostIdByIgMediaId"
  >,
  options: Pick<BuildCommentsInboxOptions, "igMediaId"> = {},
): CommentsInbox {
  const since = new Date();
  since.setDate(since.getDate() - days);

  let posts = deps.listIrisPostsSince(since);
  if (options.igMediaId) {
    posts = posts.filter((post) => post.igMediaId === options.igMediaId);
  }

  const media: InboxMedia[] = [];

  for (const post of posts) {
    const comments = deps.listCommentsByPostId(post.id);
    if (comments.length === 0) {
      continue;
    }

    media.push({
      igMediaId: post.igMediaId,
      postId: post.id,
      caption: post.caption,
      mediaTimestamp: post.publishedAt ?? post.scheduledAt ?? comments[0]!.createdAt,
      reportedCommentsCount: comments.length,
      comments: comments.map((comment) => ({
        igCommentId: comment.igCommentId,
        parentIgCommentId: comment.parentIgCommentId,
        authorUsername: comment.authorUsername,
        text: comment.text,
        timestamp: comment.createdAt,
        irisCommentId: comment.id,
        status: comment.status,
      })),
    });
  }

  const commentsFetched = media.reduce((sum, item) => sum + item.comments.length, 0);

  return {
    source: "local",
    syncedAt: new Date().toISOString(),
    days,
    media,
    summary: {
      media_scanned: posts.length,
      comments_reported: commentsFetched,
      comments_fetched: commentsFetched,
      access_limited: false,
      warning: null,
    },
  };
}

export async function buildCommentsInbox(
  days: number,
  deps: BuildCommentsInboxDeps,
  options: BuildCommentsInboxOptions = {},
): Promise<CommentsInbox> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const scope = options.scope ?? "iris";
  const readerOptions =
    options.igMediaId != null
      ? { igMediaId: options.igMediaId }
      : scope === "iris"
        ? {
            igMediaIds: deps
              .listIrisPostsSince(since)
              .map((post) => post.igMediaId)
              .filter((id): id is string => Boolean(id)),
          }
        : undefined;

  const remoteMedia = await deps.metaCommentReader.listRecentMediaWithComments(since, readerOptions);

  const media: InboxMedia[] = remoteMedia.map((item) => {
    const postId = deps.findPostIdByIgMediaId(item.igMediaId);

    const comments: InboxComment[] = item.comments.map((comment) => {
      let irisCommentId: string | null = null;
      let status: string | null = null;

      if (postId) {
        const upserted = deps.upsertFromWebhook({
          igCommentId: comment.igCommentId,
          postId,
          parentIgCommentId: comment.parentIgCommentId,
          authorUsername: comment.authorUsername,
          text: comment.text,
        });
        irisCommentId = upserted.comment.id;
        status = upserted.comment.status;
      } else {
        const existing = deps.findByIgCommentId(comment.igCommentId);
        if (existing) {
          irisCommentId = existing.id;
          status = existing.status;
        }
      }

      return {
        igCommentId: comment.igCommentId,
        parentIgCommentId: comment.parentIgCommentId,
        authorUsername: comment.authorUsername,
        text: comment.text,
        timestamp: comment.timestamp,
        irisCommentId,
        status,
      };
    });

    return {
      igMediaId: item.igMediaId,
      postId,
      caption: item.caption,
      mediaTimestamp: item.timestamp,
      reportedCommentsCount: item.reportedCommentsCount,
      comments,
    };
  });

  const visibleMedia = media.filter(
    (item) => item.comments.length > 0 || item.reportedCommentsCount > 0,
  );

  const commentsReported = visibleMedia.reduce(
    (sum, item) => sum + item.reportedCommentsCount,
    0,
  );
  const commentsFetched = visibleMedia.reduce((sum, item) => sum + item.comments.length, 0);
  const accessLimited = commentsReported > 0 && commentsFetched === 0;

  return {
    source: "meta",
    syncedAt: new Date().toISOString(),
    days,
    media: visibleMedia,
    summary: {
      media_scanned: remoteMedia.length,
      comments_reported: commentsReported,
      comments_fetched: commentsFetched,
      access_limited: accessLimited,
      warning: accessLimited
        ? "A Meta retornou comments_count nos posts, mas a lista de comentários veio vazia. Isso costuma acontecer com o app em modo desenvolvimento — coloque o app IGIris em Live (com política de privacidade) ou aguarde comentários novos via webhook."
        : null,
    },
  };
}
