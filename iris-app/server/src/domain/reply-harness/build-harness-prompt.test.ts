import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTriagePrompt } from "./build-harness-prompt.ts";
import { defaultAgentContent } from "../settings/agent-content-defaults.ts";
import { defaultReplyPersona } from "../settings/reply-persona-defaults.ts";
import type { ReplyContext } from "../reply-context/types.ts";

function mockContext(responseLanguage = "pt-BR"): ReplyContext {
  return {
    persona: { ...defaultReplyPersona(), responseLanguage, brandName: "Iris" },
    post: {
      channel: "instagram",
      status: "published",
      caption: "New product",
      scheduledAt: null,
      publishedAt: new Date().toISOString(),
      assets: [],
    },
    thread: { entries: [] },
    imageContext: { summaries: [] },
    brandUsername: null,
    targetComment: { authorUsername: "fan", text: "How much?", igCommentId: null },
  };
}

test("harness prompts are written in English", () => {
  const prompt = buildTriagePrompt(mockContext(), defaultAgentContent().restrictions);
  assert.match(prompt, /You classify Instagram comments/);
  assert.match(prompt, /Reply with valid JSON only/);
  assert.doesNotMatch(prompt, /Você classifica/);
});

test("harness prompts inject mandatory response language", () => {
  const prompt = buildTriagePrompt(mockContext("fr"), defaultAgentContent().restrictions);
  assert.match(prompt, /Response language \(MANDATORY\)/);
  assert.match(prompt, /French/);
});

test("triage prompt includes thread audience rules and not_for_brand category", () => {
  const context = mockContext();
  context.brandUsername = "colabcolibri";
  context.thread = {
    entries: [
      {
        author: "sergiolucianojr",
        text: "valeu!",
        isBrandReply: false,
        at: "2026-08-10T11:00:00.000Z",
        depth: 0,
        igCommentId: "c-1",
      },
      {
        author: "colabcolibri",
        text: "obrigado!",
        isBrandReply: true,
        at: "2026-08-10T11:01:00.000Z",
        depth: 1,
        igCommentId: "c-2",
      },
      {
        author: "fan",
        text: "@sergiolucianojr concordo",
        isBrandReply: false,
        at: "2026-08-10T11:02:00.000Z",
        depth: 2,
        igCommentId: "c-target",
      },
    ],
  };
  context.targetComment = {
    authorUsername: "fan",
    text: "@sergiolucianojr concordo",
    igCommentId: "c-target",
  };

  const prompt = buildTriagePrompt(context, defaultAgentContent().restrictions);
  assert.match(prompt, /Reply audience \(MANDATORY\)/);
  assert.match(prompt, /@colabcolibri/);
  assert.match(prompt, /not_for_brand/);
  assert.match(prompt, /not @mentions alone/i);
  assert.match(prompt, /NO @mention/i);
  assert.match(prompt, />>> TARGET/);
  assert.match(prompt, /oldest to newest/i);
  assert.doesNotMatch(prompt, /\[depth=/);
});
