import { test } from "node:test";
import assert from "node:assert/strict";
import { serializeReplyContext } from "./serialize-reply-context.ts";
import type { ReplyContext } from "./types.ts";

test("serializeReplyContext exposes target_comment and thread depth", () => {
  const context: ReplyContext = {
    persona: {
      brandName: "Iris",
      responseLanguage: "pt-BR",
      maxChars: 300,
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    post: {
      postId: "post-1",
      caption: "Olá",
      carouselSummary: "Resumo do carrossel",
      channel: "instagram",
      status: "published",
      scheduledAt: null,
      publishedAt: "2026-01-01T00:00:00.000Z",
      assets: [
        {
          filename: "01.jpg",
          sortOrder: 1,
          mime: "image/jpeg",
          width: 100,
          height: 100,
          publishUrl: "https://example.com/01.jpg",
        },
      ],
    },
    thread: {
      entries: [
        {
          author: "fan",
          text: "oi",
          isBrandReply: false,
          at: "2026-01-01T00:00:00.000Z",
          igCommentId: "ig-parent",
          depth: 0,
        },
        {
          author: "fan2",
          text: "e agora?",
          isBrandReply: false,
          at: "2026-01-01T00:01:00.000Z",
          igCommentId: "ig-child",
          depth: 1,
        },
      ],
    },
    imageContext: {
      summaries: ["Imagem 1: produto"],
      visionEnabled: true,
    },
    targetComment: {
      authorUsername: "fan2",
      text: "e agora?",
    },
  };

  const serialized = serializeReplyContext(context, {
    commentId: "comment-child",
    igCommentId: "ig-child",
    postId: "post-1",
    igMediaId: "media-1",
  });

  assert.equal(serialized.target_comment.id, "comment-child");
  assert.equal(serialized.target_comment.ig_comment_id, "ig-child");
  assert.equal(serialized.post?.ig_media_id, "media-1");
  assert.equal(serialized.post?.carousel_summary, "Resumo do carrossel");
  assert.equal(serialized.carousel_summary, "Resumo do carrossel");
  assert.equal(serialized.thread[1]?.depth, 1);
  assert.equal(serialized.thread[1]?.parent_ig_comment_id, "ig-parent");
});
