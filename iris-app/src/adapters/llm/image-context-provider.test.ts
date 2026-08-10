import { test } from "node:test";
import assert from "node:assert/strict";
import { createEnvImageContextProvider } from "./image-context-provider.ts";
import type { PostReplyContext } from "../../domain/reply-context/post-context.ts";

const basePost: PostReplyContext = {
  postId: "p1",
  caption: "x",
  carouselSummary: null,
  channel: "instagram",
  status: "published",
  scheduledAt: null,
  publishedAt: null,
  assets: [
    {
      filename: "01.jpg",
      sortOrder: 1,
      mime: "image/jpeg",
      width: 100,
      height: 100,
      publishUrl: "https://example.com/img",
    },
  ],
};

test("image context provider uses configured carousel summary", async () => {
  const provider = createEnvImageContextProvider();
  const result = await provider.build({
    ...basePost,
    carouselSummary: "Blue product on white background.",
  });

  assert.equal(result.visionEnabled, false);
  assert.equal(result.summaries[0], "Blue product on white background.");
});

test("image context provider falls back when carousel summary is missing", async () => {
  const provider = createEnvImageContextProvider();
  const result = await provider.build(basePost);
  assert.equal(result.visionEnabled, false);
  assert.match(result.summaries[0], /No carousel summary configured/);
});
