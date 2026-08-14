import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { createSqliteAgentRunRepository } from "../../adapters/sqlite/agent-run-repository.ts";
import { createSqliteAgentRunStepRepository } from "../../adapters/sqlite/agent-run-step-repository.ts";

test("agent harness telemetry migration adds session and tool columns", () => {
  const db = new DatabaseSync(":memory:");
  runMigrations(db);

  const runColumns = db
    .prepare("PRAGMA table_info(agent_runs)")
    .all()
    .map((row) => (row as { name: string }).name);
  assert.ok(runColumns.includes("started_at"));
  assert.ok(runColumns.includes("ended_at"));
  assert.ok(runColumns.includes("session_summary_json"));

  const stepColumns = db
    .prepare("PRAGMA table_info(agent_run_steps)")
    .all()
    .map((row) => (row as { name: string }).name);
  assert.ok(stepColumns.includes("step_kind"));
  assert.ok(stepColumns.includes("tool_name"));

  const runs = createSqliteAgentRunRepository(db);
  const steps = createSqliteAgentRunStepRepository(db);
  const run = runs.create({ trigger: "manual", status: "ok" });
  steps.appendBatch([
    {
      agentRunId: run.id,
      stage: "tool_call",
      stepKind: "tool",
      turnIndex: 0,
      toolName: "search_products",
      toolInput: { query: "x" },
      toolOutput: { items: [] },
      toolLatencyMs: 12,
      verdict: "pass",
      reason: "tool:search_products",
    },
  ]);

  const stored = steps.listByAgentRunId(run.id);
  assert.equal(stored[0]?.toolName, "search_products");
  assert.equal(stored[0]?.stepKind, "tool");
});
