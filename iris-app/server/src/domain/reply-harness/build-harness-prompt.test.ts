import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildFullDraftPrompt,
  buildSimpleDraftPrompt,
  buildTriagePrompt,
} from "./build-harness-prompt.ts";
import { defaultAgentContent } from "../settings/agent-content-defaults.ts";
import { defaultReplyPersona } from "../settings/reply-persona-defaults.ts";
import type { ReplyContext } from "../reply-context/types.ts";
import { filterAgentContentForPost } from "./filter-agent-content-for-post.ts";

function mockContext(responseLanguage = "pt-BR"): ReplyContext {
  return {
    persona: { ...defaultReplyPersona(), responseLanguage, brandName: "Iris" },
    post: {
      postId: "p1",
      channel: "instagram",
      status: "published",
      caption: "New product",
      carouselSummary: null,
      replyPrompt: null,
      silenceSoul: false,
      silencePage: false,
      silenceKnowledge: false,
      silenceRestrictions: false,
      scheduledAt: null,
      publishedAt: new Date().toISOString(),
      assets: [],
    },
    thread: { entries: [] },
    imageContext: { summaries: [], visionEnabled: false },
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

test("triage prompt includes crisis and hate_violence barrier categories", () => {
  const prompt = buildTriagePrompt(mockContext(), "Be kind");
  assert.match(prompt, /blockCategory "crisis"/);
  assert.match(prompt, /blockCategory "hate_violence"/);
  assert.match(prompt, /barrier LLM reply|life-risk/i);
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
  assert.match(prompt, /conversation_stalled/);
  assert.match(prompt, /thread_reply_limit/);
  assert.match(prompt, /Thread reply brakes/);
  assert.match(prompt, /not @mentions alone/i);
  assert.match(prompt, /NO @mention/i);
  assert.match(prompt, />>> TARGET/);
  assert.match(prompt, /oldest to newest/i);
  assert.doesNotMatch(prompt, /\[depth=/);
});

test("triage prompt injects post briefing when reply_prompt is set", () => {
  const context = mockContext();
  context.post!.replyPrompt = "Price is R$ 49. Link: shop.example.com/p49";
  const prompt = buildTriagePrompt(context, defaultAgentContent().restrictions);
  assert.match(prompt, /## Post briefing/);
  assert.match(prompt, /OVERRIDES conflicting global editorial content/);
  assert.match(prompt, /Price is R\$ 49/);
});

test("triage prompt omits brand restrictions when silenced", () => {
  const context = mockContext();
  context.post!.silenceRestrictions = true;
  const agent = defaultAgentContent();
  const filtered = filterAgentContentForPost(agent, {
    silenceSoul: false,
    silencePage: false,
    silenceKnowledge: false,
    silenceRestrictions: true,
  });
  const prompt = buildTriagePrompt(context, filtered.restrictions);
  assert.doesNotMatch(prompt, /## Brand restrictions/);
  assert.match(prompt, /## Default guardrails/);
});

test("full draft omits silenced soul and knowledge sections", () => {
  const context = mockContext();
  context.post!.silenceSoul = true;
  context.post!.silenceKnowledge = true;
  const agent = filterAgentContentForPost(defaultAgentContent(), {
    silenceSoul: true,
    silencePage: false,
    silenceKnowledge: true,
    silenceRestrictions: false,
  });
  const prompt = buildFullDraftPrompt(context, agent, 500);
  assert.doesNotMatch(prompt, /## SOUL/);
  assert.doesNotMatch(prompt, /## Knowledge base/);
  assert.match(prompt, /## About the page/);
});

test("simple draft omits knowledge when silenced", () => {
  const context = mockContext();
  context.post!.silenceKnowledge = true;
  const agent = filterAgentContentForPost(defaultAgentContent(), {
    silenceSoul: false,
    silencePage: false,
    silenceKnowledge: true,
    silenceRestrictions: false,
  });
  const prompt = buildSimpleDraftPrompt(context, agent, 200);
  assert.doesNotMatch(prompt, /## Links and facts/);
});

test("triage and simple draft handle low-signal Sim! without projecting post theme", () => {
  const context = mockContext();
  context.post!.caption =
    'Quando alguém diz “tanto faz”, o que você escuta?';
  context.post!.carouselSummary =
    `${"A".repeat(400)} UNIQUE_TAIL_SHOULD_NOT_APPEAR_IN_TRIAGE`;
  context.targetComment = {
    authorUsername: "veralucia239r",
    text: "Sim !",
    igCommentId: "c-sim",
  };

  const triage = buildTriagePrompt(context, defaultAgentContent().restrictions);
  assert.match(triage, /Signal: acknowledgment/);
  assert.match(triage, /LOW EVIDENCE/i);
  assert.match(triage, /Do NOT invent the user's meaning/i);
  assert.match(triage, /Target comment surface/);
  assert.doesNotMatch(triage, /UNIQUE_TAIL_SHOULD_NOT_APPEAR_IN_TRIAGE/);
  assert.match(triage, /Carousel summary: A{10,}/);

  const simple = buildSimpleDraftPrompt(context, defaultAgentContent(), 180);
  assert.match(simple, /Anti over-inference/);
  assert.match(simple, /do not treat "Sim!" as an ambiguous phrase/i);
  assert.match(simple, /Signal: acknowledgment/);
});
