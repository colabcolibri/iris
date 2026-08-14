import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  AgentRunStep,
  AgentRunStepRepository,
  CreateAgentRunStepInput,
} from "../../ports/agent-run-step-repository.ts";
import type { HarnessStageName, HarnessVerdict, StageLlmTelemetry } from "../../domain/reply-harness/types.ts";
import { sanitizeToolJson } from "../../domain/harness/sanitize-tool-json.ts";

type AgentRunStepRow = {
  id: string;
  agent_run_id: string;
  comment_id: string | null;
  message_id: string | null;
  stage: string;
  step_kind: string | null;
  turn_index: number | null;
  tool_name: string | null;
  tool_input_json: string | null;
  tool_output_json: string | null;
  tool_latency_ms: number | null;
  parent_step_id: string | null;
  verdict: string;
  reason: string | null;
  reasoning: string | null;
  output_json: string | null;
  llm_context_json: string | null;
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
    messageId: row.message_id,
    stage: row.stage as HarnessStageName,
    stepKind: (row.step_kind as AgentRunStep["stepKind"]) ?? null,
    turnIndex: row.turn_index,
    toolName: row.tool_name,
    toolInputJson: row.tool_input_json,
    toolOutputJson: row.tool_output_json,
    toolLatencyMs: row.tool_latency_ms,
    parentStepId: row.parent_step_id,
    verdict: row.verdict as HarnessVerdict,
    reason: row.reason,
    reasoning: row.reasoning,
    outputJson: row.output_json,
    llmContextJson: row.llm_context_json,
    llm: mapLlm(row),
    createdAt: row.created_at,
  };
}

function inferStepKind(step: CreateAgentRunStepInput): string {
  if (step.stepKind) {
    return step.stepKind;
  }
  if (step.llm) {
    return "llm";
  }
  if (step.toolName) {
    return "tool";
  }
  return "system";
}

export function createSqliteAgentRunStepRepository(db: DatabaseSync): AgentRunStepRepository {
  const insert = db.prepare(`
    INSERT INTO agent_run_steps (
      id,
      agent_run_id,
      comment_id,
      message_id,
      stage,
      step_kind,
      turn_index,
      tool_name,
      tool_input_json,
      tool_output_json,
      tool_latency_ms,
      parent_step_id,
      verdict,
      reason,
      reasoning,
      output_json,
      llm_context_json,
      model,
      prompt_tokens,
      completion_tokens,
      total_tokens,
      latency_ms,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const listByComment = db.prepare(`
    SELECT * FROM agent_run_steps
    WHERE comment_id = ?
    ORDER BY created_at ASC, rowid ASC
  `);

  const listByMessage = db.prepare(`
    SELECT * FROM agent_run_steps
    WHERE message_id = ?
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

  const latestRunByMessage = db.prepare(`
    SELECT agent_run_id FROM agent_run_steps
    WHERE message_id = ?
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
        const toolInputJson = step.toolInput ? sanitizeToolJson(step.toolInput) : null;
        const toolOutputJson =
          step.toolOutput !== undefined && step.toolOutput !== null
            ? sanitizeToolJson(step.toolOutput)
            : null;
        const llmContextJson = step.llmContextJson ?? null;

        insert.run(
          id,
          step.agentRunId,
          step.commentId ?? null,
          step.messageId ?? null,
          step.stage,
          inferStepKind(step),
          step.turnIndex ?? null,
          step.toolName ?? null,
          toolInputJson,
          toolOutputJson,
          step.toolLatencyMs ?? null,
          step.parentStepId ?? null,
          step.verdict,
          step.reason ?? null,
          step.reasoning ?? null,
          outputJson,
          llmContextJson,
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
          messageId: step.messageId ?? null,
          stage: step.stage,
          stepKind: inferStepKind(step) as AgentRunStep["stepKind"],
          turnIndex: step.turnIndex ?? null,
          toolName: step.toolName ?? null,
          toolInputJson,
          toolOutputJson,
          toolLatencyMs: step.toolLatencyMs ?? null,
          parentStepId: step.parentStepId ?? null,
          verdict: step.verdict,
          reason: step.reason ?? null,
          reasoning: step.reasoning ?? null,
          outputJson,
          llmContextJson,
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

    listByMessageId(messageId) {
      const rows = listByMessage.all(messageId) as AgentRunStepRow[];
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

    findLatestRunIdByMessageId(messageId) {
      const row = latestRunByMessage.get(messageId) as { agent_run_id: string } | undefined;
      return row?.agent_run_id ?? null;
    },
  };
}
