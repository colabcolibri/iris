import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReplyPrompt } from "./build-reply-prompt.ts";
import { defaultReplyPersona } from "../reply-persona-defaults.ts";

test("buildReplyPrompt includes context and mandatory language", () => {
  const prompt = buildReplyPrompt({
    persona: { ...defaultReplyPersona(), brandName: "Iris", responseLanguage: "en-US" },
    post: {
      channel: "instagram",
      status: "published",
      caption: "Test caption",
      scheduledAt: null,
      publishedAt: "2026-08-09T12:00:00.000Z",
      assets: [],
    },
    thread: {
      entries: [
        {
          author: "fan",
          text: "Hi",
          isBrandReply: false,
          at: "2026-08-09T12:01:00.000Z",
          depth: 0,
        },
      ],
    },
    imageContext: { summaries: ["Carousel with 2 image(s)."] },
    targetComment: { authorUsername: "fan", text: "Hi" },
  });

  assert.match(prompt, /Response language \(MANDATORY\)/);
  assert.match(prompt, /American English/);
  assert.match(prompt, /Test caption/);
  assert.match(prompt, /@fan: Hi/);
  assert.doesNotMatch(prompt, /## Persona/);
});
