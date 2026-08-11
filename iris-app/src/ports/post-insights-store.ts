import type { MediaInsightMetric } from "./meta-insights-reader.ts";
import type { SerializedPostMedia } from "../domain/post-media/serialize-post-media.ts";

export type PostInsightsSnapshot = {
  id: string;
  postId: string;
  igMediaId: string;
  metrics: MediaInsightMetric[];
  media: SerializedPostMedia | null;
  fetchedAt: string;
};

export type InsertPostInsightsSnapshotInput = {
  postId: string;
  igMediaId: string;
  metrics: MediaInsightMetric[];
  media: SerializedPostMedia | null;
  fetchedAt: string;
};

export type PostInsightsStore = {
  insert(input: InsertPostInsightsSnapshotInput): PostInsightsSnapshot;
  findLatestByPostId(postId: string): PostInsightsSnapshot | null;
  listByPostId(postId: string, limit: number): PostInsightsSnapshot[];
};
