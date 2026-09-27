import assert from "node:assert/strict";
import { test } from "node:test";
import { openDatabase } from "../sqlite/connection.ts";
import { createSqliteLlmCallLog } from "../sqlite/llm-call-log.ts";
import { runMigrations } from "../sqlite/migrate.ts";
import { createLlmConfigResolver } from "../../domain/llm/resolve-llm-config.ts";
import {
  LlmCompletionError,
  createTestLlmCompletion,
  type LlmCompleter,
} from "../../ports/llm-completer.ts";
import type { LlmSettingsStore } from "../../ports/llm-settings-store.ts";
import { withLlmCallLog } from "./recording-llm-completer.ts";

const storedSettings = {
  apiKey: "sk-test",
  apiUrl: "https://llm.test/v1/chat/completions",
  model: "gpt-test",
  supportsVision: false,
  updatedAt: "2026-09-27T00:00:00.000Z",
};

function settingsStore(): LlmSettingsStore {
  return {
    get: () => storedSettings,
    upsert: () => storedSettings,
    clear: () => undefined,
  };
}

test("withLlmCallLog writes one row for a successful call and one for a billed failure", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const log = createSqliteLlmCallLog(db);
    let calls = 0;
    const inner: LlmCompleter = {
      async complete() {
        calls += 1;
        if (calls === 1) {
          return createTestLlmCompletion("ok", {
            model: "gpt-test",
            usage: { promptTokens: 11, completionTokens: 4, totalTokens: 15 },
            latencyMs: 20,
          });
        }
        throw new LlmCompletionError("empty", {
          model: "gpt-test",
          usage: { promptTokens: 9, completionTokens: 0, totalTokens: 9 },
          latencyMs: 8,
        });
      },
    };

    const completer = withLlmCallLog(inner, log);
    await completer.complete("hello", { source: "draft" });
    await assert.rejects(() => completer.complete("again", { source: "carousel_slide" }));

    const rows = db
      .prepare(
        `SELECT source, status, prompt_tokens, completion_tokens, total_tokens, error_message
         FROM llm_calls ORDER BY rowid`,
      )
      .all() as Array<{
      source: string;
      status: string;
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      error_message: string | null;
    }>;

    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.source, "draft");
    assert.equal(rows[0]?.status, "ok");
    assert.equal(rows[0]?.prompt_tokens, 11);
    assert.equal(rows[0]?.completion_tokens, 4);
    assert.equal(rows[0]?.total_tokens, 15);
    assert.equal(rows[0]?.error_message, null);
    assert.equal(rows[1]?.source, "carousel_slide");
    assert.equal(rows[1]?.status, "error");
    assert.equal(rows[1]?.prompt_tokens, 9);
    assert.equal(rows[1]?.error_message, "empty");
  } finally {
    db.close();
  }
});

test("a call without source never reaches the provider", async () => {
  let called = false;
  const completer = withLlmCallLog(
    {
      async complete() {
        called = true;
        return createTestLlmCompletion("nope");
      },
    },
    { record() {} },
  );

  await assert.rejects(
    () => completer.complete("hello"),
    /LLM call missing source/,
  );
  assert.equal(called, false);
});

test("createLlmConfigResolver records the provider call on the account log", async () => {
  const db = openDatabase(":memory:");

  try {
    runMigrations(db);
    const log = createSqliteLlmCallLog(db);
    const resolver = createLlmConfigResolver(
      settingsStore(),
      {
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              model: "gpt-test",
              usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
              choices: [{ message: { content: "oi" } }],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
      },
      log,
    );

    const completer = resolver.createCompleter();
    assert.ok(completer);
    await completer.complete("oi", { source: "carousel_synthesis" });

    const row = db
      .prepare("SELECT model, source, status, total_tokens FROM llm_calls")
      .get() as { model: string; source: string; status: string; total_tokens: number };
    assert.equal(row.model, "gpt-test");
    assert.equal(row.source, "carousel_synthesis");
    assert.equal(row.status, "ok");
    assert.equal(row.total_tokens, 5);
  } finally {
    db.close();
  }
});
