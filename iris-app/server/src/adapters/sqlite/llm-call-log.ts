import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { LlmCallLog, RecordLlmCallInput } from "../../ports/llm-call-log.ts";

export function createSqliteLlmCallLog(db: DatabaseSync): LlmCallLog {
  const insert = db.prepare(`
    INSERT INTO llm_calls (
      id,
      model,
      source,
      status,
      prompt_tokens,
      completion_tokens,
      total_tokens,
      latency_ms,
      error_message,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return {
    record(input: RecordLlmCallInput) {
      insert.run(
        randomUUID(),
        input.model,
        input.source,
        input.status,
        input.promptTokens,
        input.completionTokens,
        input.totalTokens,
        input.latencyMs,
        input.errorMessage,
        new Date().toISOString(),
      );
    },
  };
}
