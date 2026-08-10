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

export type BuildCommentsInboxDeps = {
  metaCommentReader: MetaCommentReader;
  findPostIdByIgMediaId: (igMediaId: string) => string | null;
  upsertFromWebhook: (input: {
    igCommentId: string;
    postId: string;
    parentIgCommentId?: string | null;
    authorUsername?: string | null;
    text?: string | null;
  }) => { comment: { id: string; status: string } };
  findByIgCommentId: (igCommentId: string) => { id: string; status: string } | null;
};

export async function buildCommentsInbox(
  days: number,
  deps: BuildCommentsInboxDeps,
): Promise<CommentsInbox> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const remoteMedia = await deps.metaCommentReader.listRecentMediaWithComments(since);

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
