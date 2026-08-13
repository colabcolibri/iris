import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteConversationRepository } from "../../adapters/sqlite/conversation-repository.ts";
import {
  createSqliteMessageRepository,
  createSqliteMessageReplyRepository,
} from "../../adapters/sqlite/message-repository.ts";
import { createSqliteAgentRunRepository } from "../../adapters/sqlite/agent-run-repository.ts";
import { createSqliteAgentRunStepRepository } from "../../adapters/sqlite/agent-run-step-repository.ts";
import {
  recoverOrphanedMessageDraft,
  resolveMessageDraftText,
} from "./resolve-message-draft.ts";
import type { AppContext } from "../../api/app-context.ts";

function buildCtx(db: ReturnType<typeof openDatabase>): AppContext {
  return {
    messages: createSqliteMessageRepository(db),
    messageReplies: createSqliteMessageReplyRepository(db),
    agentRuns: createSqliteAgentRunRepository(db),
    agentRunSteps: createSqliteAgentRunStepRepository(db),
  } as unknown as AppContext;
}

test("resolveMessageDraftText recovers harness output when draft row is missing", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const ctx = buildCtx(db);
    const conversations = createSqliteConversationRepository(db);
    const { conversation } = conversations.upsert({
      igConversationId: "ig:1",
      participantIgUserId: "user-1",
    });
    const inbound = ctx.messages.upsertInbound({
      igMessageId: "mid-1",
      conversationId: conversation.id,
      text: "Obrigada",
      igTimestamp: "2026-08-13T10:00:00.000Z",
    }).message;
    ctx.messages.markFailed(inbound.id, "save failed");

    const run = ctx.agentRuns.create({
      trigger: "manual",
      inputSummary: "{}",
      outputSummary: "Rascunho recuperado para teste.",
      status: "ok",
      flowId: "flow-1",
    });
    ctx.agentRunSteps.appendBatch([
      {
        agentRunId: run.id,
        messageId: inbound.id,
        stage: "message_verify",
        verdict: "pass",
        reason: "ok",
        reasoning: null,
        outputJson: null,
        llm: null,
      },
    ]);
    ctx.messageReplies.createReply({
      messageId: inbound.id,
      sentText: "",
      status: "failed",
      agentRunId: run.id,
    });

    assert.equal(recoverOrphanedMessageDraft(inbound, ctx), "Rascunho recuperado para teste.");
    assert.equal(resolveMessageDraftText(inbound, ctx), "Rascunho recuperado para teste.");
  } finally {
    db.close();
  }
});

test("resolveMessageDraftText hides draft after sent reply exists", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const ctx = buildCtx(db);
    const conversations = createSqliteConversationRepository(db);
    const { conversation } = conversations.upsert({
      igConversationId: "ig:3",
      participantIgUserId: "user-3",
    });
    const inbound = ctx.messages.upsertInbound({
      igMessageId: "mid-3",
      conversationId: conversation.id,
      text: "oi",
      igTimestamp: "2026-08-13T10:00:00.000Z",
    }).message;

    ctx.messageReplies.upsertDraft({
      messageId: inbound.id,
      draftText: "draft antigo",
    });
    ctx.messageReplies.createReply({
      messageId: inbound.id,
      sentText: "já enviado",
      status: "sent",
    });

    assert.equal(resolveMessageDraftText(inbound, ctx), null);
  } finally {
    db.close();
  }
});

test("resolveMessageDraftText prefers stored draft and skips recovery after clear", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const ctx = buildCtx(db);
    const conversations = createSqliteConversationRepository(db);
    const { conversation } = conversations.upsert({
      igConversationId: "ig:2",
      participantIgUserId: "user-2",
    });
    const inbound = ctx.messages.upsertInbound({
      igMessageId: "mid-2",
      conversationId: conversation.id,
      text: "oi",
      igTimestamp: "2026-08-13T10:00:00.000Z",
    }).message;

    ctx.messageReplies.upsertDraft({
      messageId: inbound.id,
      draftText: "draft salvo",
    });

    const run = ctx.agentRuns.create({
      trigger: "manual",
      outputSummary: "outro texto",
      status: "ok",
      flowId: "flow-2",
    });
    ctx.agentRunSteps.appendBatch([
      {
        agentRunId: run.id,
        messageId: inbound.id,
        stage: "message_draft",
        verdict: "pass",
        reason: null,
        reasoning: null,
        outputJson: null,
        llm: null,
      },
    ]);

    assert.equal(resolveMessageDraftText(inbound, ctx), "draft salvo");
    ctx.messageReplies.clearDraft(inbound.id);
    assert.equal(resolveMessageDraftText(inbound, ctx), null);
  } finally {
    db.close();
  }
});
