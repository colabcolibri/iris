import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReplyPrompt } from "./build-reply-prompt.ts";
import { finalizeAgentPrompt } from "../reply-harness/agent-prompt.ts";
import { defaultReplyPersona } from "../settings/reply-persona-defaults.ts";

test("buildReplyPrompt includes context and mandatory language at send time", () => {
  const persona = { ...defaultReplyPersona(), brandName: "Iris", responseLanguage: "en-US" };
  const context = {
    persona,
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
    imageContext: {
      summaries: ["Carousel with 2 image(s)."],
      visionEnabled: false,
    },
    brandUsername: null,
    targetComment: { authorUsername: "fan", text: "Hi", igCommentId: null },
  };
  const prompt = finalizeAgentPrompt(buildReplyPrompt(context), persona, "publicReplyOnly");

  assert.match(prompt, /Response language \(MANDATORY\)/);
  assert.match(prompt, /American English/);
  assert.match(prompt, /Test caption/);
  assert.match(prompt, /@fan: Hi/);
  assert.doesNotMatch(prompt, /## Persona/);
});
