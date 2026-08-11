import type { CommentRepository } from "../../ports/comment-repository.ts";
import { buildPostReplyContext, type BuildPostReplyContextDeps } from "./build-post-context.ts";
import { buildCommentThreadContext } from "./build-thread-context.ts";

export type ReplyInspectionThreadEntry = {
  author: string | null;
  text: string | null;
  is_brand_reply: boolean;
  at: string;
  depth: number;
};

export type ReplyInspectionComment = {
  id: string;
  author_username: string | null;
  text: string | null;
  status: string;
  created_at: string;
  parent_ig_comment_id: string | null;
  thread: ReplyInspectionThreadEntry[];
};

export type ReplyInspection = {
  post_context: {
    caption_truncated: string | null;
    assets: Array<{
      filename: string;
      sort_order: number;
      public_url: string | null;
    }>;
  };
  comments: ReplyInspectionComment[];
  auto_reply_enabled: boolean;
};

export type BuildReplyInspectionDeps = BuildPostReplyContextDeps & {
  comments: CommentRepository;
};

export function buildReplyInspection(
  postId: string,
  deps: BuildReplyInspectionDeps,
): ReplyInspection | null {
  const post = deps.posts.findById(postId);
  if (!post) {
    return null;
  }

  const postContext = buildPostReplyContext(postId, deps);
  const comments = deps.comments.listByPostId(postId);

  return {
    post_context: {
      caption_truncated: truncateText(postContext?.caption ?? null, 120),
      assets:
        postContext?.assets.map((asset) => ({
          filename: asset.filename,
          sort_order: asset.sortOrder,
          public_url: asset.publishUrl,
        })) ?? [],
    },
    comments: comments.map((comment) => {
      const thread =
        buildCommentThreadContext(comment.id, { comments: deps.comments })?.entries ?? [];

      return {
        id: comment.id,
        author_username: comment.authorUsername,
        text: comment.text,
        status: comment.status,
        created_at: comment.createdAt,
        parent_ig_comment_id: comment.parentIgCommentId,
        thread: thread.map((entry) => ({
          author: entry.isBrandReply ? "marca" : entry.author,
          text: entry.text,
          is_brand_reply: entry.isBrandReply,
          at: entry.at,
          depth: entry.depth,
        })),
      };
    }),
    auto_reply_enabled: post.autoReplyEnabled,
  };
}

function truncateText(text: string | null, maxLength: number): string | null {
  if (!text) {
    return null;
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}
