import { test } from "node:test";
import assert from "node:assert/strict";
import { createEnvImageContextProvider } from "./image-context-provider.ts";
import type { PostReplyContext } from "../../domain/reply-context/post-context.ts";

test("image context provider falls back without vision", async () => {
  const provider = createEnvImageContextProvider({ llm: null, model: "gpt-4o-mini" });
  const post: PostReplyContext = {
    postId: "p1",
    caption: "x",
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

  const result = await provider.build(post);
  assert.equal(result.visionEnabled, false);
  assert.match(result.summaries[0], /Carrossel com 1 imagem/);
});

test("image context provider uses llm when vision enabled", async () => {
  const provider = createEnvImageContextProvider({
    model: "gpt-4o",
    llm: {
      async complete(prompt) {
        assert.match(prompt, /Descreva/);
        return "Produto azul";
      },
    },
  });

  const result = await provider.build({
    postId: "p1",
    caption: "x",
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
  });

  assert.equal(result.visionEnabled, true);
  assert.match(result.summaries[0], /Produto azul/);
});
