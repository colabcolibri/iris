import type { Post, PostStatus } from "../domain/post.ts";
import type { ReplyMode } from "../domain/reply-mode.ts";

export type CreatePostInput = {
  caption?: string | null;
  channel: string;
  scheduledAt?: string | null;
  sourceNote?: string | null;
  status?: PostStatus;
  igMediaId?: string | null;
  publishedAt?: string | null;
  replyMode?: ReplyMode;
};

export type UpdatePostInput = {
  caption?: string | null;
  channel?: string;
  scheduledAt?: string | null;
  sourceNote?: string | null;
  status?: PostStatus;
  publishedAt?: string | null;
  igMediaId?: string | null;
  errorMessage?: string | null;
  autoReplyEnabled?: boolean;
  replyMode?: ReplyMode;
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
