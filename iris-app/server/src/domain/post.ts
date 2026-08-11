import type { PostReplyModeSetting } from "./reply-mode.ts";
import type { IgMediaStatus } from "./meta/ig-media-status.ts";

export type PostStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "monitored"
  | "cancelled"
  | "failed";

export type Post = {
  id: string;
  status: PostStatus;
  channel: string;
  caption: string | null;
  carouselSummary: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  igMediaId: string | null;
  igMediaStatus: IgMediaStatus | null;
  igMediaStatusDetail: string | null;
  igMediaStatusCheckedAt: string | null;
  sourceNote: string | null;
  errorMessage: string | null;
  autoReplyEnabled: boolean;
  replyMode: PostReplyModeSetting;
  createdAt: string;
  updatedAt: string;
  assetsCount?: number;
};

export type PostAsset = {
  id: string;
  postId: string;
  sortOrder: number;
  storagePath: string;
  originalFilename: string | null;
  mime: string;
  width: number | null;
  height: number | null;
  originalSizeBytes: number | null;
  optimizedSizeBytes: number | null;
  createdAt: string;
};
