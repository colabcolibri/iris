import type { Post, PostStatus } from "../domain/post.ts";

export type CreatePostInput = {
  caption?: string | null;
  channel: string;
  scheduledAt?: string | null;
  sourceNote?: string | null;
  status?: PostStatus;
};

export type PostRepository = {
  create(input: CreatePostInput): Post;
  findById(id: string): Post | null;
};
