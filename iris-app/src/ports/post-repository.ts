import type { Post, PostStatus } from "../domain/post.ts";

export type CreatePostInput = {
  caption?: string | null;
  channel: string;
  scheduledAt?: string | null;
  sourceNote?: string | null;
  status?: PostStatus;
};

export type UpdatePostInput = {
  caption?: string | null;
  channel?: string;
  scheduledAt?: string | null;
  sourceNote?: string | null;
  status?: PostStatus;
};

export type ListPostsFilter = {
  status?: PostStatus;
  from?: string;
  to?: string;
};

export type PostRepository = {
  create(input: CreatePostInput): Post;
  findById(id: string): Post | null;
  list(filter?: ListPostsFilter): Post[];
  update(id: string, input: UpdatePostInput): Post | null;
  cancel(id: string): Post | null;
};
