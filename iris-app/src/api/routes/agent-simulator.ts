import { readJsonBody, sendJson } from "../json.ts";
import { createRouter, route } from "../router.ts";
import { simulateReply } from "../../domain/agent-simulator/simulate-reply.ts";

export const handleAgentSimulatorRoute = createRouter([
  route("POST", "/api/agent/simulate", { admin: true }, async (match) => {
    const body = await readJsonBody<Record<string, unknown>>(match.req);
    const result = await simulateReply(
      {
        caption: typeof body.caption === "string" ? body.caption : null,
        carousel_summary:
          typeof body.carousel_summary === "string" ? body.carousel_summary : null,
        response_language:
          typeof body.response_language === "string" ? body.response_language : undefined,
        brand_name:
          body.brand_name === null
            ? null
            : typeof body.brand_name === "string"
              ? body.brand_name
              : undefined,
        max_chars: typeof body.max_chars === "number" ? body.max_chars : undefined,
        thread: Array.isArray(body.thread)
          ? body.thread.map((entry) => {
              const row = entry as Record<string, unknown>;
              return {
                author: typeof row.author === "string" ? row.author : "user",
                text: typeof row.text === "string" ? row.text : "",
                is_brand_reply: row.is_brand_reply === true,
                at: typeof row.at === "string" ? row.at : undefined,
              };
            })
          : undefined,
        target_comment: {
          author:
            typeof (body.target_comment as Record<string, unknown> | undefined)?.author ===
            "string"
              ? ((body.target_comment as Record<string, unknown>).author as string)
              : "user",
          text:
            typeof (body.target_comment as Record<string, unknown> | undefined)?.text === "string"
              ? ((body.target_comment as Record<string, unknown>).text as string)
              : "",
        },
      },
      {
        personaStore: match.ctx.replyPersonaStore,
        agentContentStore: match.ctx.agentContentStore,
        llm: match.ctx.resolveLlmCompleter(),
        agentRuns: match.ctx.agentRuns,
        agentRunSteps: match.ctx.agentRunSteps,
      },
    );

    sendJson(match.res, 200, result);
  }),
]);
