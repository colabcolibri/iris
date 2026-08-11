import type { Post, PostStatus } from "../domain/posts/post.ts";
import type { PostReplyModeSetting } from "../domain/posts/reply-mode.ts";
import type { IgMediaStatus } from "../domain/meta/ig-media-status.ts";

export type CreatePostInput = {
  caption?: string | null;
  channel: string;
  scheduledAt?: string | null;
  sourceNote?: string | null;
  status?: PostStatus;
  igMediaId?: string | null;
  publishedAt?: string | null;
  replyMode?: PostReplyModeSetting;
};

export type UpdatePostInput = {
  caption?: string | null;
  carouselSummary?: string | null;
  channel?: string;
  scheduledAt?: string | null;
  sourceNote?: string | null;
  status?: PostStatus;
  publishedAt?: string | null;
  igMediaId?: string | null;
  igMediaStatus?: IgMediaStatus | null;
  igMediaStatusDetail?: string | null;
  igMediaStatusCheckedAt?: string | null;
  errorMessage?: string | null;
  autoReplyEnabled?: boolean;
  replyMode?: PostReplyModeSetting;
};

export type ListPostsFilter = {
  status?: PostStatus;
  from?: string;
  to?: string;
  /** Exclui rascunhos sem data editorial; usa published_at ou scheduled_at no range. */
  calendarOnly?: boolean;
};

export type PostRepository = {
  create(input: CreatePostInput): Post;
  findById(id: string): Post | null;
  findByIgMediaId(igMediaId: string): Post | null;
  findCommentableByIgMediaId(igMediaId: string): Post | null;
  list(filter?: ListPostsFilter): Post[];
  update(id: string, input: UpdatePostInput): Post | null;
  cancel(id: string): Post | null;
};
