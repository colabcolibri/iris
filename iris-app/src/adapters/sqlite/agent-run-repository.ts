import type {
  AgentRunListItem,
  AgentRunRepository,
  CreateAgentRunInput,
  ListAgentRunsOptions,
} from "../../ports/agent-run-repository.ts";
import type { AgentRun } from "../../ports/agent-run-repository.ts";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

type AgentRunRow = {
  id: string;
  trigger: string;
  input_summary: string | null;
  output_summary: string | null;
  status: string;
  created_at: string;
};

type AgentRunListRow = {
  id: string;
  trigger: string;
  status: string;
  output_summary: string | null;
  created_at: string;
  comment_id: string | null;
  post_id: string | null;
  step_count: number;
  triage_reason: string | null;
  triage_output_json: string | null;
  first_step_at: string | null;
  last_step_at: string | null;
};

function mapRow(row: AgentRunRow): AgentRun {
  return {
    id: row.id,
    trigger: row.trigger,
    inputSummary: row.input_summary,
    outputSummary: row.output_summary,
    status: row.status as AgentRun["status"],
    createdAt: row.created_at,
  };
}

function parseReplyTier(row: AgentRunListRow): string | null {
  if (row.triage_output_json) {
    try {
      const parsed = JSON.parse(row.triage_output_json) as { replyTier?: string };
      if (parsed.replyTier) {
        return parsed.replyTier;
      }
    } catch {
      // ignore
    }
  }
  if (row.triage_reason?.includes("tier:simple")) {
    return "simple";
  }
  if (row.triage_reason?.includes("tier:full")) {
    return "full";
  }
  if (row.triage_reason?.includes("tier:none")) {
    return "none";
  }
  return null;
}

function deriveTerminalStatus(row: AgentRunListRow, replyTier: string | null): string | null {
  const summary = row.output_summary ?? "";
  if (
    summary === "blocked_harmful" ||
    summary === "skipped_triage" ||
    summary === "rejected_verify" ||
    summary === "approved_simple" ||
    summary === "approved"
  ) {
    return summary;
  }
  if (row.triage_reason?.includes("block:harmful")) {
    return "blocked_harmful";
  }
  if (row.status === "skipped") {
    return "skipped_triage";
  }
  if (row.status === "failed") {
    return "rejected_verify";
  }
  if (row.status === "ok" && replyTier === "simple") {
    return "approved_simple";
  }
  if (row.status === "ok") {
    return "approved";
  }
  return null;
}

function durationMs(row: AgentRunListRow): number | null {
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
  const replyTier = parseReplyTier(row);
  return {
    id: row.id,
    trigger: row.trigger,
    status: row.status as AgentRun["status"],
    outputSummary: row.output_summary,
    createdAt: row.created_at,
    commentId: row.comment_id,
    postId: row.post_id,
    stepCount: row.step_count,
    replyTier,
    terminalStatus: deriveTerminalStatus(row, replyTier),
    durationMs: durationMs(row),
  };
}

export function createSqliteAgentRunRepository(db: DatabaseSync): AgentRunRepository {
  const insert = db.prepare(`
    INSERT INTO agent_runs (id, trigger, input_summary, output_summary, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const findByIdStmt = db.prepare("SELECT * FROM agent_runs WHERE id = ?");

  const listStmt = db.prepare(`
    SELECT
      ar.id,
      ar.trigger,
      ar.status,
      ar.output_summary,
      ar.created_at,
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
      ) AS last_step_at
    FROM agent_runs ar
    WHERE (? IS NULL OR ar.created_at < ?)
    ORDER BY ar.created_at DESC, ar.rowid DESC
    LIMIT ?
  `);

  return {
    create(input: CreateAgentRunInput) {
      const id = randomUUID();
      const createdAt = new Date().toISOString();

      insert.run(
        id,
        input.trigger,
        input.inputSummary ?? null,
        input.outputSummary ?? null,
        input.status,
        createdAt,
      );

      return mapRow(
        db.prepare("SELECT * FROM agent_runs WHERE id = ?").get(id) as AgentRunRow,
      );
    },

    findById(id) {
      const row = findByIdStmt.get(id) as AgentRunRow | undefined;
      return row ? mapRow(row) : null;
    },

    listRecent(options: ListAgentRunsOptions = {}) {
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
