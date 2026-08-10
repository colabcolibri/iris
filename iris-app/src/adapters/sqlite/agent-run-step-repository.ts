import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  AgentRunStep,
  AgentRunStepRepository,
  CreateAgentRunStepInput,
} from "../../ports/agent-run-step-repository.ts";
import type { HarnessStageName, HarnessVerdict, StageLlmTelemetry } from "../../domain/reply-harness/types.ts";

type AgentRunStepRow = {
  id: string;
  agent_run_id: string;
  comment_id: string | null;
  stage: string;
  verdict: string;
  reason: string | null;
  reasoning: string | null;
  output_json: string | null;
  model: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  latency_ms: number | null;
  created_at: string;
};

function mapLlm(row: AgentRunStepRow): StageLlmTelemetry | null {
  if (!row.model) {
    return null;
  }

  return {
    model: row.model,
    promptTokens: row.prompt_tokens,
    completionTokens: row.completion_tokens,
    totalTokens: row.total_tokens,
    latencyMs: row.latency_ms ?? 0,
  };
}

function mapRow(row: AgentRunStepRow): AgentRunStep {
  return {
    id: row.id,
    agentRunId: row.agent_run_id,
    commentId: row.comment_id,
    stage: row.stage as HarnessStageName,
    verdict: row.verdict as HarnessVerdict,
    reason: row.reason,
    reasoning: row.reasoning,
    outputJson: row.output_json,
    llm: mapLlm(row),
    createdAt: row.created_at,
  };
}

export function createSqliteAgentRunStepRepository(db: DatabaseSync): AgentRunStepRepository {
  const insert = db.prepare(`
    INSERT INTO agent_run_steps (
      id,
      agent_run_id,
      comment_id,
      stage,
      verdict,
      reason,
      reasoning,
      output_json,
      model,
      prompt_tokens,
      completion_tokens,
      total_tokens,
      latency_ms,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const listByComment = db.prepare(`
    SELECT * FROM agent_run_steps
    WHERE comment_id = ?
    ORDER BY created_at ASC, rowid ASC
  `);

  const listByRun = db.prepare(`
    SELECT * FROM agent_run_steps
    WHERE agent_run_id = ?
    ORDER BY created_at ASC, rowid ASC
  `);

  const latestRun = db.prepare(`
    SELECT agent_run_id FROM agent_run_steps
    WHERE comment_id = ?
    ORDER BY created_at DESC, rowid DESC
    LIMIT 1
  `);

  return {
    appendBatch(steps) {
      const created: AgentRunStep[] = [];
      const createdAt = new Date().toISOString();

      for (const step of steps) {
        const id = randomUUID();
        const outputJson = step.outputJson ? JSON.stringify(step.outputJson) : null;
        const llm = step.llm ?? null;
        insert.run(
          id,
          step.agentRunId,
          step.commentId ?? null,
          step.stage,
          step.verdict,
          step.reason ?? null,
          step.reasoning ?? null,
          outputJson,
          llm?.model ?? null,
          llm?.promptTokens ?? null,
          llm?.completionTokens ?? null,
          llm?.totalTokens ?? null,
          llm?.latencyMs ?? null,
          createdAt,
        );
        created.push({
          id,
          agentRunId: step.agentRunId,
          commentId: step.commentId ?? null,
          stage: step.stage,
          verdict: step.verdict,
          reason: step.reason ?? null,
          reasoning: step.reasoning ?? null,
          outputJson,
          llm,
          createdAt,
        });
      }

      return created;
    },

    listByCommentId(commentId) {
      const rows = listByComment.all(commentId) as AgentRunStepRow[];
      return rows.map(mapRow);
    },

    listByAgentRunId(agentRunId) {
      const rows = listByRun.all(agentRunId) as AgentRunStepRow[];
      return rows.map(mapRow);
    },

    findLatestRunIdByCommentId(commentId) {
      const row = latestRun.get(commentId) as { agent_run_id: string } | undefined;
      return row?.agent_run_id ?? null;
    },
  };
}
