import { test } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "./connection.ts";
import { runMigrations } from "./migrate.ts";
import { createSqliteAgentRunStepRepository } from "./agent-run-step-repository.ts";
import { createSqliteAgentRunRepository } from "./agent-run-repository.ts";

test("agent run steps append and list by comment", () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const runs = createSqliteAgentRunRepository(db);
    const steps = createSqliteAgentRunStepRepository(db);

    const postId = db
      .prepare(
        `INSERT INTO posts (id, channel, status, caption, created_at, updated_at)
         VALUES ('post-1', 'instagram', 'published', 'c', datetime('now'), datetime('now'))`,
      )
      .run();
    assert.ok(postId);

    db.prepare(
      `INSERT INTO comments (id, post_id, ig_comment_id, text, status, created_at)
       VALUES ('comment-1', 'post-1', 'ig-1', 'oi', 'pending', datetime('now'))`,
    ).run();

    const run = runs.create({
      trigger: "worker",
      status: "ok",
      inputSummary: "{}",
      outputSummary: "ok",
    });

    const created = steps.appendBatch([
      {
        agentRunId: run.id,
        commentId: "comment-1",
        stage: "triage",
        verdict: "pass",
        reason: "tier:full · ok",
        reasoning: "legítimo",
        outputJson: {
          shouldReply: true,
          replyTier: "full",
          blockCategory: "none",
          reason: "ok",
          reasoning: "legítimo",
        },
      },
      {
        agentRunId: run.id,
        commentId: "comment-1",
        stage: "draft",
        verdict: "pass",
        reason: "draft_generated",
        reasoning: "Olá",
      },
      {
        agentRunId: run.id,
        commentId: "comment-1",
        stage: "verify",
        verdict: "pass",
        reason: "approved",
        reasoning: "adequado",
      },
    ]);

    assert.equal(created.length, 3);
    const listed = steps.listByCommentId("comment-1");
    assert.equal(listed.length, 3);
    assert.equal(listed[0]?.stage, "triage");
    assert.equal(listed[0]?.outputJson?.includes("replyTier"), true);
    assert.equal(listed[2]?.stage, "verify");
    assert.equal(steps.listByAgentRunId(run.id).length, 3);
    assert.equal(steps.findLatestRunIdByCommentId("comment-1"), run.id);
  } finally {
    db.close();
  }
});
