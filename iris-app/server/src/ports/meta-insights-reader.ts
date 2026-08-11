export type MediaInsightMetric = {
  name: string;
  period: string;
  values: Array<{ value: number }>;
};

export type AccountInsightsQuery = {
  metrics: string[];
  period: string;
  /** Unix seconds (Meta). */
  since?: number;
  until?: number;
};

export type MediaPageWithInsightsQuery = {
  limit?: number;
  after?: string | null;
  /** ISO timestamps — filtro local após a página Meta. */
  sinceIso?: string | null;
  untilIso?: string | null;
  metrics?: string[];
};

export type MediaPageInsightItem = {
  igMediaId: string;
  caption: string | null;
  timestamp: string | null;
  likeCount: number | null;
  commentsCount: number | null;
  insights: MediaInsightMetric[];
};

export type MediaPageWithInsightsResult = {
  items: MediaPageInsightItem[];
  nextCursor: string | null;
};

export type MetaInsightsReader = {
  getMediaInsights(
    igMediaId: string,
    metrics: string[],
  ): Promise<MediaInsightMetric[]>;
  getAccountInsights(query: AccountInsightsQuery): Promise<MediaInsightMetric[]>;
  listMediaPageWithInsights(
    query?: MediaPageWithInsightsQuery,
  ): Promise<MediaPageWithInsightsResult>;
};
