import type { ReplyContext } from "./types.ts";

export type SerializedReplyContextMeta = {
  commentId: string;
  igCommentId: string;
  postId: string;
  igMediaId: string | null;
};

export type SerializedReplyContext = {
  target_comment: {
    id: string;
    ig_comment_id: string;
    author: string | null;
    text: string | null;
  };
  thread: Array<{
    ig_comment_id: string | null;
    parent_ig_comment_id: string | null;
    author: string | null;
    text: string | null;
    depth: number;
    is_brand_reply: boolean;
    at: string;
  }>;
  post: {
    id: string;
    caption: string | null;
    carousel_summary: string | null;
    status: string;
    ig_media_id: string | null;
    channel: string;
    published_at: string | null;
  } | null;
  carousel_summary: string | null;
  persona: {
    response_language: string;
    brand_name: string | null;
    max_chars: number;
  };
};

export function serializeReplyContext(
  context: ReplyContext,
  meta: SerializedReplyContextMeta,
): SerializedReplyContext {
  const summaries = context.imageContext.summaries;
  const carouselSummary =
    context.post?.carouselSummary?.trim() ?? summaries[0]?.trim() ?? null;

  return {
    target_comment: {
      id: meta.commentId,
      ig_comment_id: meta.igCommentId,
      author: context.targetComment.authorUsername,
      text: context.targetComment.text,
    },
    thread: context.thread.entries.map((entry, index) => ({
      ig_comment_id: entry.igCommentId ?? null,
      parent_ig_comment_id: inferParentId(context.thread.entries, index),
      author: entry.author,
      text: entry.text,
      depth: entry.depth,
      is_brand_reply: entry.isBrandReply,
      at: entry.at,
    })),
    post: context.post
      ? {
          id: meta.postId,
          caption: context.post.caption,
          carousel_summary: carouselSummary,
          status: context.post.status,
          ig_media_id: meta.igMediaId,
          channel: context.post.channel,
          published_at: context.post.publishedAt,
        }
      : null,
    carousel_summary: carouselSummary,
    persona: {
      response_language: context.persona.responseLanguage,
      brand_name: context.persona.brandName,
      max_chars: context.persona.maxChars,
    },
  };
}

function inferParentId(
  entries: ReplyContext["thread"]["entries"],
  index: number,
): string | null {
  const current = entries[index];
  if (!current || current.isBrandReply || current.depth === 0) {
    return null;
  }

  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const candidate = entries[cursor];
    if (!candidate || candidate.isBrandReply) {
      continue;
    }

    if (candidate.depth < current.depth) {
      return candidate.igCommentId ?? null;
    }
  }

  return null;
}
