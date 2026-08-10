export type RemoteComment = {
  igCommentId: string;
  parentIgCommentId: string | null;
  authorUsername: string | null;
  text: string | null;
  timestamp: string;
};

export type RemoteMediaWithComments = {
  igMediaId: string;
  caption: string | null;
  timestamp: string;
  reportedCommentsCount: number;
  comments: RemoteComment[];
};

export type MetaCommentReader = {
  listRecentMediaWithComments(since: Date): Promise<RemoteMediaWithComments[]>;
};
