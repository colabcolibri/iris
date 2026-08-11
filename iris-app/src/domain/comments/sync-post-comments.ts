import type { MetaCommentReader } from "../../ports/meta-comment-reader.ts";
import type { Comment } from "../comment.ts";
import { normalizeCommentTimestamp } from "./normalize-comment-timestamp.ts";

export type SyncPostCommentsDeps = {
  metaCommentReader: MetaCommentReader;
  upsertFromWebhook: (input: {
    igCommentId: string;
    postId: string;
    parentIgCommentId?: string | null;
    authorUsername?: string | null;
    text?: string | null;
    igTimestamp?: string | null;
  }) => { comment: Comment; created: boolean };
};

export type SyncPostCommentsInput = {
  postId: string;
  igMediaId: string;
};

export type SyncPostCommentsResult = {
  postId: string;
  igMediaId: string;
  syncedAt: string;
  reportedCommentsCount: number;
  commentsFetched: number;
  accessLimited: boolean;
  warning: string | null;
  comments: Comment[];
};

export async function syncPostComments(
  input: SyncPostCommentsInput,
  deps: SyncPostCommentsDeps,
): Promise<SyncPostCommentsResult> {
  const since = new Date();
  since.setDate(since.getDate() - 365);

  const remoteMedia = await deps.metaCommentReader.listRecentMediaWithComments(since, {
    igMediaId: input.igMediaId,
  });

  const media = remoteMedia[0];
  if (!media) {
    return {
      postId: input.postId,
      igMediaId: input.igMediaId,
      syncedAt: new Date().toISOString(),
      reportedCommentsCount: 0,
      commentsFetched: 0,
      accessLimited: false,
      warning: null,
      comments: [],
    };
  }

  const comments: Comment[] = [];

  for (const remoteComment of media.comments) {
    const upserted = deps.upsertFromWebhook({
      igCommentId: remoteComment.igCommentId,
      postId: input.postId,
      parentIgCommentId: remoteComment.parentIgCommentId,
      authorUsername: remoteComment.authorUsername,
      text: remoteComment.text,
      igTimestamp: normalizeCommentTimestamp(remoteComment.timestamp),
    });
    comments.push(upserted.comment);
  }

  const accessLimited = media.reportedCommentsCount > 0 && comments.length === 0;

  return {
    postId: input.postId,
    igMediaId: input.igMediaId,
    syncedAt: new Date().toISOString(),
    reportedCommentsCount: media.reportedCommentsCount,
    commentsFetched: comments.length,
    accessLimited,
    warning: accessLimited
      ? "A Meta retornou comments_count neste post, mas a lista veio vazia. Comentários novos ainda podem chegar via webhook."
      : null,
    comments,
  };
}
