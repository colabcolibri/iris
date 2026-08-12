export type PostAssetContext = {
  filename: string;
  sortOrder: number;
  mime: string;
  width: number | null;
  height: number | null;
  publishUrl: string | null;
};

export type PostReplyContext = {
  postId: string;
  caption: string | null;
  carouselSummary: string | null;
  replyPrompt: string | null;
  silenceSoul: boolean;
  silencePage: boolean;
  silenceKnowledge: boolean;
  silenceRestrictions: boolean;
  channel: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  assets: PostAssetContext[];
};
