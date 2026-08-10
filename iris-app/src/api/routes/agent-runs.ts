import type { IncomingMessage, ServerResponse } from "node:http";
import type { AuthContext } from "../auth.ts";
import { requireAdmin } from "../auth.ts";
import type { AppContext } from "../app-context.ts";
import { sendError, sendJson } from "../json.ts";
import { serializeReplyAudit } from "../../domain/reply-audit/serialize-reply-audit.ts";

type RouteRequest = {
  req: IncomingMessage;
  res: ServerResponse;
  ctx: AppContext;
  auth: AuthContext;
};

export async function handleAgentRunsRoute(request: RouteRequest): Promise<boolean> {
  const { req, res, ctx, auth } = request;
  const { pathname } = new URL(req.url ?? "/", "http://localhost");

  if (pathname === "/api/agent-runs" && req.method === "GET") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    const url = new URL(req.url ?? "", "http://localhost");
    const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
    const cursor = url.searchParams.get("cursor");
    const terminalStatus = url.searchParams.get("terminal_status");
    const replyTier = url.searchParams.get("reply_tier");

    const result = ctx.agentRuns.listRecent({
      limit: Number.isFinite(limit) ? limit : 50,
      cursor,
      terminalStatus,
      replyTier,
    });

    sendJson(res, 200, {
      items: result.items.map((item) => ({
        id: item.id,
        trigger: item.trigger,
        status: item.status,
        output_summary: item.outputSummary,
        created_at: item.createdAt,
        comment_id: item.commentId,
        post_id: item.postId,
        step_count: item.stepCount,
        reply_tier: item.replyTier,
        terminal_status: item.terminalStatus,
        duration_ms: item.durationMs,
      })),
      next_cursor: result.nextCursor,
    });
    return true;
  }

  const detailMatch = /^\/api\/agent-runs\/([^/]+)$/.exec(pathname);
  if (detailMatch && req.method === "GET") {
    if (!requireAdmin(auth)) {
      sendError(res, 403, "admin token required");
      return true;
    }

    const runId = detailMatch[1];
    const run = ctx.agentRuns.findById(runId);
    if (!run) {
      sendError(res, 404, "agent run not found");
      return true;
    }

    const steps = ctx.agentRunSteps.listByAgentRunId(runId);
    const commentId = steps[0]?.commentId ?? null;

    sendJson(res, 200, {
      run,
      comment_id: commentId,
      audit: serializeReplyAudit(run, steps),
    });
    return true;
  }

  return false;
}
