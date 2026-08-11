/** Métricas suportadas pela Instagram Media Insights API (sem `impressions`, depreciado em mídias recentes). */
export const STANDARD_MEDIA_INSIGHT_METRICS = [
  "reach",
  "views",
  "likes",
  "comments",
  "saved",
] as const;

export type StandardMediaInsightMetric = (typeof STANDARD_MEDIA_INSIGHT_METRICS)[number];
