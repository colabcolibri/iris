import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReplyPrompt } from "./build-reply-prompt.ts";
import { defaultReplyPersona } from "../reply-persona-defaults.ts";

test("buildReplyPrompt includes persona post thread and target", () => {
  const prompt = buildReplyPrompt({
    persona: { ...defaultReplyPersona(), brandName: "Iris" },
    post: {
      postId: "p1",
      caption: "Legenda teste",
      channel: "instagram",
      status: "published",
      scheduledAt: null,
      publishedAt: "2026-08-09T12:00:00.000Z",
      assets: [],
    },
    thread: {
      entries: [
        {
          author: "fan",
          text: "Oi",
          isBrandReply: false,
          at: "2026-08-09T12:01:00.000Z",
        },
      ],
    },
    imageContext: { summaries: ["Carrossel com 2 imagem(ns)."], visionEnabled: false },
    targetComment: { authorUsername: "fan", text: "Oi" },
  });

  assert.match(prompt, /## Persona/);
  assert.match(prompt, /## Post/);
  assert.match(prompt, /Legenda teste/);
  assert.match(prompt, /## Thread/);
  assert.match(prompt, /## Comentário a responder/);
  assert.match(prompt, /@fan: Oi/);
});
