import { test } from "node:test";
import assert from "node:assert/strict";
import type { ReplyContext } from "../reply-context/types.ts";
import { defaultReplyPersona } from "../settings/reply-persona-defaults.ts";
import {
  MAX_BRAND_REPLIES_PER_THREAD,
  countBrandRepliesInThread,
  evaluateThreadReplyBrakes,
  hasFollowUpIntent,
} from "./thread-reply-brakes.ts";

function baseContext(overrides: Partial<ReplyContext> = {}): ReplyContext {
  return {
    persona: { ...defaultReplyPersona(), brandName: "Colibri" },
    post: null,
    thread: { entries: [] },
    imageContext: { summaries: [], visionEnabled: false },
    brandUsername: "colabcolibri",
    targetComment: {
      authorUsername: "fan",
      text: "obrigado!",
      igCommentId: "target",
    },
    ...overrides,
  };
}

test("countBrandRepliesInThread counts brand entries only", () => {
  const context = baseContext({
    thread: {
      entries: [
        {
          author: "fan",
          text: "oi",
          isBrandReply: false,
          at: "2026-08-10T10:00:00.000Z",
          depth: 0,
        },
        {
          author: "marca",
          text: "olá!",
          isBrandReply: true,
          at: "2026-08-10T10:01:00.000Z",
          depth: 0,
        },
      ],
    },
  });

  assert.equal(countBrandRepliesInThread(context.thread), 1);
});

test("evaluateThreadReplyBrakes skips thanks after brand already replied", () => {
  const brake = evaluateThreadReplyBrakes(
    baseContext({
      thread: {
        entries: [
          {
            author: "fan",
            text: "qual o prazo?",
            isBrandReply: false,
            at: "2026-08-10T10:00:00.000Z",
            depth: 0,
            igCommentId: "c1",
          },
          {
            author: "marca",
            text: "5 a 7 dias úteis",
            isBrandReply: true,
            at: "2026-08-10T10:01:00.000Z",
            depth: 0,
            igCommentId: "c2",
          },
          {
            author: "fan",
            text: "obrigado!",
            isBrandReply: false,
            at: "2026-08-10T10:02:00.000Z",
            depth: 1,
            igCommentId: "target",
          },
        ],
      },
      targetComment: {
        authorUsername: "fan",
        text: "obrigado!",
        igCommentId: "target",
      },
    }),
  );

  assert.ok(brake);
  assert.equal(brake?.reason, "conversation_stalled");
  assert.equal(brake?.blockCategory, "conversation_stalled");
});

test("evaluateThreadReplyBrakes allows substantive follow-up after brand reply", () => {
  const brake = evaluateThreadReplyBrakes(
    baseContext({
      thread: {
        entries: [
          {
            author: "fan",
            text: "qual o prazo?",
            isBrandReply: false,
            at: "2026-08-10T10:00:00.000Z",
            depth: 0,
            igCommentId: "c1",
          },
          {
            author: "marca",
            text: "5 a 7 dias úteis",
            isBrandReply: true,
            at: "2026-08-10T10:01:00.000Z",
            depth: 0,
            igCommentId: "c2",
          },
          {
            author: "fan",
            text: "mas vocês repõem o tamanho P?",
            isBrandReply: false,
            at: "2026-08-10T10:02:00.000Z",
            depth: 1,
            igCommentId: "target",
          },
        ],
      },
      targetComment: {
        authorUsername: "fan",
        text: "mas vocês repõem o tamanho P?",
        igCommentId: "target",
      },
    }),
  );

  assert.equal(brake, null);
});

test("evaluateThreadReplyBrakes allows first thanks on thread without brand reply", () => {
  const brake = evaluateThreadReplyBrakes(
    baseContext({
      targetComment: {
        authorUsername: "fan",
        text: "obrigado pelo post!",
        igCommentId: "target",
      },
    }),
  );

  assert.equal(brake, null);
});

test("evaluateThreadReplyBrakes blocks when brand reply limit reached", () => {
  const brandEntries = Array.from({ length: MAX_BRAND_REPLIES_PER_THREAD }, (_, index) => ({
    author: "marca",
    text: `resposta ${index + 1}`,
    isBrandReply: true,
    at: `2026-08-10T10:${String(index).padStart(2, "0")}:00.000Z`,
    depth: 0,
    igCommentId: `brand-${index}`,
  }));

  const brake = evaluateThreadReplyBrakes(
    baseContext({
      thread: { entries: brandEntries },
      targetComment: {
        authorUsername: "fan",
        text: "ainda tenho dúvida sobre o produto",
        igCommentId: "target",
      },
    }),
  );

  assert.ok(brake);
  assert.equal(brake?.reason, "thread_reply_limit");
  assert.equal(brake?.brandReplyCount, MAX_BRAND_REPLIES_PER_THREAD);
});

test("evaluateThreadReplyBrakes detects repeated user message", () => {
  const brake = evaluateThreadReplyBrakes(
    baseContext({
      thread: {
        entries: [
          {
            author: "fan",
            text: "kkk",
            isBrandReply: false,
            at: "2026-08-10T10:00:00.000Z",
            depth: 0,
            igCommentId: "c1",
          },
          {
            author: "marca",
            text: "haha que bom!",
            isBrandReply: true,
            at: "2026-08-10T10:01:00.000Z",
            depth: 0,
            igCommentId: "c2",
          },
          {
            author: "fan",
            text: "kkk",
            isBrandReply: false,
            at: "2026-08-10T10:02:00.000Z",
            depth: 1,
            igCommentId: "target",
          },
        ],
      },
      targetComment: {
        authorUsername: "fan",
        text: "kkk",
        igCommentId: "target",
      },
    }),
  );

  assert.equal(brake?.reason, "conversation_stalled");
});

test("evaluateThreadReplyBrakes does not stall when target mentions another user", () => {
  const brake = evaluateThreadReplyBrakes(
    baseContext({
      thread: {
        entries: [
          {
            author: "marca",
            text: "obrigado!",
            isBrandReply: true,
            at: "2026-08-10T10:01:00.000Z",
            depth: 0,
            igCommentId: "c2",
          },
          {
            author: "fan",
            text: "@outro concordo",
            isBrandReply: false,
            at: "2026-08-10T10:02:00.000Z",
            depth: 1,
            igCommentId: "target",
          },
        ],
      },
      targetComment: {
        authorUsername: "fan",
        text: "@outro concordo",
        igCommentId: "target",
      },
    }),
  );

  assert.equal(brake, null);
});

test("hasFollowUpIntent detects questions and continuations", () => {
  assert.equal(hasFollowUpIntent("e o frete?"), true);
  assert.equal(hasFollowUpIntent("mas o P voltou"), true);
  assert.equal(hasFollowUpIntent("obrigado"), false);
});
