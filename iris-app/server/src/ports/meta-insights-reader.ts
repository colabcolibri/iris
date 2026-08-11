export type MediaInsightMetric = {
  name: string;
  period: string;
  values: Array<{ value: number }>;
};

export type MetaInsightsReader = {
  getMediaInsights(
    igMediaId: string,
    metrics: string[],
  ): Promise<MediaInsightMetric[]>;
};
