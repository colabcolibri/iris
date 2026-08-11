import { sendError, sendJson } from "../json.ts";
import { createRouter, route } from "../router.ts";
import { routeParam } from "../route-resources.ts";
import { serializeReplyAudit } from "../../domain/reply-audit/serialize-reply-audit.ts";

export const handleAgentRunsRoute = createRouter([
  route("GET", "/api/agent-runs", { admin: true }, async (match) => {
    const limit = Number.parseInt(match.searchParams.get("limit") ?? "50", 10);
    const cursor = match.searchParams.get("cursor");
    const terminalStatus = match.searchParams.get("terminal_status");
    const replyTier = match.searchParams.get("reply_tier");

    const result = match.ctx.agentRuns.listRecent({
      limit: Number.isFinite(limit) ? limit : 50,
      cursor,
      terminalStatus,
      replyTier,
    });

    sendJson(match.res, 200, {
      items: result.items.map((item) => ({
        id: item.id,
        flow_id: item.flowId,
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
        total_prompt_tokens: item.totalPromptTokens,
        total_completion_tokens: item.totalCompletionTokens,
        total_tokens: item.totalTokens,
      })),
      next_cursor: result.nextCursor,
    });
  }),

  route(
    "GET",
    /^\/api\/agent-runs\/([^/]+)$/,
    { admin: true },
    async (match) => {
      const runId = routeParam(match, "runId");
      const run = match.ctx.agentRuns.findById(runId);
      if (!run) {
        sendError(match.res, 404, "agent run not found");
        return;
      }

      const steps = match.ctx.agentRunSteps.listByAgentRunId(runId);
      const commentId = steps[0]?.commentId ?? null;

      sendJson(match.res, 200, {
        run: {
          id: run.id,
          flowId: run.flowId,
          trigger: run.trigger,
          inputSummary: run.inputSummary,
          outputSummary: run.outputSummary,
          status: run.status,
          createdAt: run.createdAt,
        },
        comment_id: commentId,
        audit: serializeReplyAudit(run, steps),
      });
    },
    { paramNames: ["runId"] },
  ),
]);
