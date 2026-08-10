import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  AgentRunStep,
  AgentRunStepRepository,
  CreateAgentRunStepInput,
} from "../../ports/agent-run-step-repository.ts";
import type { HarnessStageName, HarnessVerdict } from "../../domain/reply-harness/types.ts";

type AgentRunStepRow = {
  id: string;
  agent_run_id: string;
  comment_id: string;
  stage: string;
  verdict: string;
  reason: string | null;
  reasoning: string | null;
  output_json: string | null;
  created_at: string;
};

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
    createdAt: row.created_at,
  };
}

export function createSqliteAgentRunStepRepository(db: DatabaseSync): AgentRunStepRepository {
  const insert = db.prepare(`
    INSERT INTO agent_run_steps (
      id, agent_run_id, comment_id, stage, verdict, reason, reasoning, output_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        insert.run(
          id,
          step.agentRunId,
          step.commentId,
          step.stage,
          step.verdict,
          step.reason ?? null,
          step.reasoning ?? null,
          outputJson,
          createdAt,
        );
        created.push({
          id,
          agentRunId: step.agentRunId,
          commentId: step.commentId,
          stage: step.stage,
          verdict: step.verdict,
          reason: step.reason ?? null,
          reasoning: step.reasoning ?? null,
          outputJson,
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
