import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildReplyAuditSummary,
  serializeReplyAuditSummary,
} from "./build-reply-audit-summary.ts";
import type { ReplyContext } from "./types.ts";

function baseContext(overrides: Partial<ReplyContext> = {}): ReplyContext {
  return {
    persona: {
      brandName: "Iris",
      responseLanguage: "pt-BR",
      maxChars: 280,
      updatedAt: "2026-08-09T00:00:00.000Z",
    },
    post: {
      postId: "post-1",
      caption: "Legenda longa do post para teste",
      carouselSummary: null,
      channel: "instagram",
      status: "published",
      scheduledAt: null,
      publishedAt: "2026-08-09T00:00:00.000Z",
      assets: [
        {
          filename: "0.jpg",
          sortOrder: 0,
          mime: "image/jpeg",
          width: 100,
          height: 100,
          publishUrl: "https://example.com/0.jpg",
        },
      ],
    },
    thread: {
      entries: [
        {
          author: "fan",
          text: "oi",
          isBrandReply: false,
          at: "2026-08-09T00:00:00.000Z",
        },
      ],
    },
    imageContext: {
      summaries: ["carrossel com 1 imagem"],
      visionEnabled: false,
    },
    targetComment: {
      authorUsername: "verylongusername_that_exceeds_limit_12345",
      text: "texto sensível do comentário",
    },
    ...overrides,
  };
}

test("buildReplyAuditSummary includes structured fields without PII", () => {
  const summary = buildReplyAuditSummary(baseContext());

  assert.equal(summary.post_id, "post-1");
  assert.equal(summary.thread_length, 1);
  assert.equal(summary.asset_count, 1);
  assert.equal(summary.vision_assets, 1);
  assert.equal(summary.author_handle?.length, 32);
});

test("serializeReplyAuditSummary omits caption and comment text", () => {
  const serialized = serializeReplyAuditSummary(buildReplyAuditSummary(baseContext()));

  assert.doesNotMatch(serialized, /Legenda longa/);
  assert.doesNotMatch(serialized, /texto sensível/);
  const parsed = JSON.parse(serialized) as { post_id: string };
  assert.equal(parsed.post_id, "post-1");
});
