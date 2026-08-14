import type {
  AgentRunListItem,
  AgentRunRepository,
  AgentRunStatus,
  CreateAgentRunInput,
  UpdateAgentRunOutcomeInput,
} from "../../ports/agent-run-repository.ts";
import type { AgentRun } from "../../ports/agent-run-repository.ts";
import type { HarnessSessionSummary } from "../../domain/harness/types.ts";
import { deriveHarnessAuditMeta } from "../../domain/reply-audit/derive-harness-audit-meta.ts";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

type AgentRunRow = {
  id: string;
  flow_id: string | null;
  trigger: string;
  input_summary: string | null;
  output_summary: string | null;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  session_summary_json: string | null;
  created_at: string;
};

type AgentRunListRow = {
  id: string;
  flow_id: string | null;
  trigger: string;
  status: string;
  output_summary: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  session_summary_json: string | null;
  comment_id: string | null;
  post_id: string | null;
  step_count: number;
  llm_call_count: number;
  tool_call_count: number;
  triage_reason: string | null;
  triage_output_json: string | null;
  first_step_at: string | null;
  last_step_at: string | null;
  total_prompt_tokens: number | null;
  total_completion_tokens: number | null;
  total_tokens: number | null;
  models_csv: string | null;
};

function parseSessionSummary(raw: string | null): HarnessSessionSummary | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as HarnessSessionSummary;
  } catch {
    return null;
  }
}

function mapRow(row: AgentRunRow): AgentRun {
  return {
    id: row.id,
    flowId: row.flow_id ?? row.id,
    trigger: row.trigger,
    inputSummary: row.input_summary,
    outputSummary: row.output_summary,
    status: row.status as AgentRun["status"],
    startedAt: row.started_at ?? row.created_at,
    endedAt: row.ended_at,
    sessionSummary: parseSessionSummary(row.session_summary_json),
    createdAt: row.created_at,
  };
}

function durationMs(row: AgentRunListRow): number | null {
  const summary = parseSessionSummary(row.session_summary_json);
  if (summary?.durationMs != null) {
    return summary.durationMs;
  }

  if (row.started_at && row.ended_at) {
    const start = Date.parse(row.started_at);
    const end = Date.parse(row.ended_at);
    if (!Number.isNaN(start) && !Number.isNaN(end)) {
      return Math.max(0, end - start);
    }
  }

  if (!row.first_step_at || !row.last_step_at) {
    return null;
  }
  const start = Date.parse(row.first_step_at);
  const end = Date.parse(row.last_step_at);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }
  return Math.max(0, end - start);
}

function mapListRow(row: AgentRunListRow): AgentRunListItem {
  const sessionSummary = parseSessionSummary(row.session_summary_json);
  const meta = deriveHarnessAuditMeta({
    status: row.status as AgentRunStatus,
    outputSummary: row.output_summary,
    triageReason: row.triage_reason,
    triageOutputJson: row.triage_output_json,
  });

  return {
    id: row.id,
    flowId: row.flow_id ?? row.id,
    trigger: row.trigger,
    status: row.status as AgentRun["status"],
    outputSummary: row.output_summary,
    createdAt: row.created_at,
    startedAt: row.started_at ?? row.created_at,
    endedAt: row.ended_at,
    commentId: row.comment_id,
    postId: row.post_id,
    stepCount: sessionSummary?.stepCount ?? row.step_count,
    llmCallCount: sessionSummary?.llmCallCount ?? row.llm_call_count,
    toolCallCount: sessionSummary?.toolCallCount ?? row.tool_call_count,
    replyTier: meta.replyTier,
    terminalStatus: meta.terminalStatus,
    durationMs: durationMs(row),
    totalPromptTokens: sessionSummary?.totalPromptTokens ?? row.total_prompt_tokens,
    totalCompletionTokens:
      sessionSummary?.totalCompletionTokens ?? row.total_completion_tokens,
    totalTokens: sessionSummary?.totalTokens ?? row.total_tokens,
    models: sessionSummary?.models?.length
      ? sessionSummary.models
      : parseModelsCsv(row.models_csv),
    sessionSummary,
  };
}

function parseModelsCsv(csv: string | null): string[] {
  if (!csv?.trim()) {
    return [];
  }
  const seen = new Set<string>();
  const models: string[] = [];
  for (const part of csv.split(",")) {
    const model = part.trim();
    if (!model || seen.has(model)) {
      continue;
    }
    seen.add(model);
    models.push(model);
  }
  return models;
}

export function createSqliteAgentRunRepository(db: DatabaseSync): AgentRunRepository {
  const insert = db.prepare(`
    INSERT INTO agent_runs (
      id, flow_id, trigger, input_summary, output_summary, status, started_at, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateOutcomeStmt = db.prepare(`
    UPDATE agent_runs
    SET output_summary = ?, status = ?, ended_at = ?, session_summary_json = ?
    WHERE id = ?
  `);

  const findByIdStmt = db.prepare("SELECT * FROM agent_runs WHERE id = ?");

  const listStmt = db.prepare(`
    SELECT
      ar.id,
      ar.flow_id,
      ar.trigger,
      ar.status,
      ar.output_summary,
      ar.created_at,
      ar.started_at,
      ar.ended_at,
      ar.session_summary_json,
      (
        SELECT s.comment_id FROM agent_run_steps s
        WHERE s.agent_run_id = ar.id
        ORDER BY s.created_at ASC, s.rowid ASC
        LIMIT 1
      ) AS comment_id,
      (
        SELECT c.post_id FROM agent_run_steps s
        JOIN comments c ON c.id = s.comment_id
        WHERE s.agent_run_id = ar.id
        ORDER BY s.created_at ASC, s.rowid ASC
        LIMIT 1
      ) AS post_id,
      (
        SELECT COUNT(*) FROM agent_run_steps s WHERE s.agent_run_id = ar.id
      ) AS step_count,
      (
        SELECT COUNT(*) FROM agent_run_steps s
        WHERE s.agent_run_id = ar.id AND s.step_kind = 'llm'
      ) AS llm_call_count,
      (
        SELECT COUNT(*) FROM agent_run_steps s
        WHERE s.agent_run_id = ar.id AND s.stage = 'tool_call'
      ) AS tool_call_count,
      (
        SELECT s.reason FROM agent_run_steps s
        WHERE s.agent_run_id = ar.id AND s.stage = 'triage'
        ORDER BY s.created_at ASC, s.rowid ASC
        LIMIT 1
      ) AS triage_reason,
      (
        SELECT s.output_json FROM agent_run_steps s
        WHERE s.agent_run_id = ar.id AND s.stage = 'triage'
        ORDER BY s.created_at ASC, s.rowid ASC
        LIMIT 1
      ) AS triage_output_json,
      (
        SELECT MIN(s.created_at) FROM agent_run_steps s WHERE s.agent_run_id = ar.id
      ) AS first_step_at,
      (
        SELECT MAX(s.created_at) FROM agent_run_steps s WHERE s.agent_run_id = ar.id
      ) AS last_step_at,
      (
        SELECT SUM(s.prompt_tokens) FROM agent_run_steps s WHERE s.agent_run_id = ar.id
      ) AS total_prompt_tokens,
      (
        SELECT SUM(s.completion_tokens) FROM agent_run_steps s WHERE s.agent_run_id = ar.id
      ) AS total_completion_tokens,
      (
        SELECT SUM(s.total_tokens) FROM agent_run_steps s WHERE s.agent_run_id = ar.id
      ) AS total_tokens,
      (
        SELECT GROUP_CONCAT(DISTINCT s.model)
        FROM agent_run_steps s
        WHERE s.agent_run_id = ar.id
          AND s.model IS NOT NULL
          AND TRIM(s.model) != ''
      ) AS models_csv
    FROM agent_runs ar
    WHERE (? IS NULL OR ar.created_at < ?)
    ORDER BY ar.created_at DESC, ar.rowid DESC
    LIMIT ?
  `);

  return {
    create(input: CreateAgentRunInput) {
      const id = randomUUID();
      const flowId = input.flowId ?? id;
      const createdAt = new Date().toISOString();

      insert.run(
        id,
        flowId,
        input.trigger,
        input.inputSummary ?? null,
        input.outputSummary ?? null,
        input.status,
        createdAt,
        createdAt,
      );

      return mapRow(findByIdStmt.get(id) as AgentRunRow);
    },

    updateOutcome(id: string, input: UpdateAgentRunOutcomeInput) {
      const sessionJson = input.sessionSummary ? JSON.stringify(input.sessionSummary) : null;
      updateOutcomeStmt.run(
        input.outputSummary,
        input.status,
        input.endedAt ?? new Date().toISOString(),
        sessionJson,
        id,
      );
      return mapRow(findByIdStmt.get(id) as AgentRunRow);
    },

    findById(id) {
      const row = findByIdStmt.get(id) as AgentRunRow | undefined;
      return row ? mapRow(row) : null;
    },

    listRecent(options = {}) {
      const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
      const cursor = options.cursor ?? null;
      const rows = listStmt.all(cursor, cursor, limit + 1) as AgentRunListRow[];

      let items = rows.map(mapListRow);

      if (options.terminalStatus) {
        items = items.filter((item) => item.terminalStatus === options.terminalStatus);
      }
      if (options.replyTier) {
        items = items.filter((item) => item.replyTier === options.replyTier);
      }

      const hasMore = items.length > limit;
      const page = hasMore ? items.slice(0, limit) : items;
      const nextCursor = hasMore ? page.at(-1)?.createdAt ?? null : null;

      return { items: page, nextCursor };
    },
  };
}
