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

export type ListRecentMediaOptions = {
  igMediaId?: string;
  /** Quando informado, busca só esses posts (evita varrer /me/media). */
  igMediaIds?: string[];
};

export type RemoteMediaSlide = {
  url: string;
  mediaType: string | null;
  thumbnailUrl: string | null;
};

export type RemoteMediaMetadata = {
  igMediaId: string;
  caption: string | null;
  timestamp: string | null;
  permalink?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
};

export type RemoteMediaPreview = {
  permalink: string | null;
  mediaType: string | null;
  slides: RemoteMediaSlide[];
};

export type MetaCommentReader = {
  listRecentMediaWithComments(
    since: Date,
    options?: ListRecentMediaOptions,
  ): Promise<RemoteMediaWithComments[]>;
  fetchMediaMetadata(igMediaId: string): Promise<RemoteMediaMetadata>;
  fetchMediaPreview(igMediaId: string): Promise<RemoteMediaPreview>;
  findMediaByPermalink(permalink: string): Promise<RemoteMediaMetadata | null>;
};
