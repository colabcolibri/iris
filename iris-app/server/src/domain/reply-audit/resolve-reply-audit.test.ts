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
  resolveCommentReplyAudit,
  resolveMessageReplyAudit,
} from "./resolve-reply-audit.ts";

test("resolveMessageReplyAudit returns steps for the linked agent run only", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const agentRuns = createSqliteAgentRunRepository(db);
    const agentRunSteps = createSqliteAgentRunStepRepository(db);
    const messages = createSqliteMessageRepository(db);
    const messageReplies = createSqliteMessageReplyRepository(db);
    const conversations = createSqliteConversationRepository(db);

    const { conversation } = conversations.upsert({
      igConversationId: "ig:1",
      participantIgUserId: "user-1",
    });
    const inbound = messages.upsertInbound({
      igMessageId: "mid-1",
      conversationId: conversation.id,
      text: "Quanto custa?",
      igTimestamp: "2026-08-13T10:00:00.000Z",
    }).message;

    const oldRun = agentRuns.create({
      trigger: "worker",
      status: "ok",
      outputSummary: "old",
    });
    const newRun = agentRuns.create({
      trigger: "worker",
      status: "ok",
      outputSummary: "new",
    });

    agentRunSteps.appendBatch([
      {
        agentRunId: oldRun.id,
        messageId: inbound.id,
        stage: "message_triage",
        verdict: "pass",
        reason: "old",
        reasoning: "old",
      },
      {
        agentRunId: newRun.id,
        messageId: inbound.id,
        stage: "message_triage",
        verdict: "pass",
        reason: "new",
        reasoning: "new",
      },
      {
        agentRunId: newRun.id,
        messageId: inbound.id,
        stage: "tool_call",
        stepKind: "tool",
        toolName: "search_products",
        verdict: "pass",
        reason: "tool:search_products",
        reasoning: "",
      },
      {
        agentRunId: newRun.id,
        messageId: inbound.id,
        stage: "message_verify",
        verdict: "pass",
        reason: "ok",
        reasoning: "ok",
      },
    ]);

    messageReplies.createReply({
      messageId: inbound.id,
      sentText: "Resposta",
      status: "sent",
      agentRunId: newRun.id,
    });

    const resolved = resolveMessageReplyAudit(inbound.id, {
      agentRuns,
      agentRunSteps,
      messageReplies,
    });

    assert.ok(resolved);
    assert.equal(resolved?.run.id, newRun.id);
    assert.equal(resolved?.steps.length, 3);
    assert.ok(resolved?.steps.some((step) => step.stage === "tool_call"));
  } finally {
    db.close();
  }
});

test("resolveCommentReplyAudit prefers draft agent_run_id", () => {
  const db = openDatabase(":memory:");
  try {
    runMigrations(db);
    const agentRuns = createSqliteAgentRunRepository(db);
    const agentRunSteps = createSqliteAgentRunStepRepository(db);

    const run = agentRuns.create({
      trigger: "worker",
      status: "ok",
      outputSummary: "draft",
    });

    const comments = {
      findLatestSentReply: () => null,
      findLatestDraft: () => ({ agentRunId: run.id }),
    };

    agentRunSteps.appendBatch([
      {
        agentRunId: run.id,
        commentId: null,
        stage: "triage",
        verdict: "pass",
        reason: "tier:full",
        reasoning: "ok",
      },
      {
        agentRunId: run.id,
        commentId: null,
        stage: "draft",
        verdict: "pass",
        reason: "ok",
        reasoning: "ok",
      },
    ]);

    const resolved = resolveCommentReplyAudit("c-1", {
      agentRuns,
      agentRunSteps,
      comments,
    });

    assert.equal(resolved?.run.id, run.id);
    assert.equal(resolved?.steps.length, 2);
  } finally {
    db.close();
  }
});
