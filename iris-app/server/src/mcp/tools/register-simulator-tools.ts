import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../../api/app-context.ts";
import { ValidationError } from "../../api/json.ts";
import {
  resolveSimulateReplyInput,
  simulateReply,
} from "../../domain/agent-simulator/simulate-reply.ts";
import {
  resolveSimulateMessageReplyInput,
  simulateMessageReply,
} from "../../domain/agent-simulator/simulate-message-reply.ts";
import {
  normalizeSimulatorScenarioInput,
  serializeSimulatorScenario,
  serializeSimulatorScenarioListItem,
} from "../../domain/agent-simulator/simulator-scenario.ts";
import { jsonToolContent, toolError } from "../tool-response.ts";

const threadMessageSchema = z.object({
  author: z.string(),
  text: z.string(),
  is_brand_reply: z.boolean().optional(),
  at: z.string().optional(),
});

function buildSimulateBody(args: Record<string, unknown>): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(args)) {
    if (value !== undefined) {
      body[key] = value;
    }
  }

  return body;
}

export function registerSimulatorTools(server: McpServer, ctx: AppContext): void {
  server.tool(
    "iris_list_simulator_scenarios",
    "List persisted simulator scenarios (summary only — no full thread)",
    {},
    async () => {
      const items = ctx.simulatorScenarioStore.list().map(serializeSimulatorScenarioListItem);
      return jsonToolContent({ items });
    },
  );

  server.tool(
    "iris_create_simulator_scenario",
    "Create a persisted simulator scenario (same validation as REST admin)",
    {
      id: z.string(),
      label: z.string(),
      description: z.string(),
      caption: z.string(),
      carousel_summary: z.string(),
      thread: z.array(threadMessageSchema),
      target_author: z.string(),
      target_text: z.string(),
    },
    async (args) => {
      try {
        const input = normalizeSimulatorScenarioInput(args, { requireId: true });
        const created = ctx.simulatorScenarioStore.create(input);
        return jsonToolContent(serializeSimulatorScenario(created));
      } catch (error) {
        if (error instanceof ValidationError) {
          return toolError(error.message);
        }
        return toolError(error instanceof Error ? error.message : "create failed");
      }
    },
  );

  server.tool(
    "iris_simulate_reply",
    "Run reply harness sandbox (scenario_id or inline payload; does not publish to Meta)",
    {
      scenario_id: z.string().optional(),
      caption: z.string().nullable().optional(),
      carousel_summary: z.string().nullable().optional(),
      response_language: z.string().optional(),
      brand_name: z.string().nullable().optional(),
      brand_username: z.string().nullable().optional(),
      max_chars: z.number().int().optional(),
      thread: z.array(threadMessageSchema).optional(),
      target_author: z.string().optional(),
      target_text: z.string().optional(),
      target_comment: z
        .object({
          author: z.string(),
          text: z.string(),
        })
        .optional(),
      channel: z.enum(["comment", "dm"]).optional(),
      participant_username: z.string().optional(),
      reply_prompt: z.string().nullable().optional(),
      target_message: z
        .object({
          author: z.string(),
          text: z.string(),
        })
        .optional(),
    },
    async (args) => {
      try {
        const body = buildSimulateBody(args);
        const channel = body.channel === "dm" ? "dm" : "comment";

        if (channel === "dm") {
          const input = resolveSimulateMessageReplyInput(body);
          const result = await simulateMessageReply(input, {
            personaStore: ctx.replyPersonaStore,
            messageAgentContentStore: ctx.messageAgentContentStore,
            products: ctx.products,
            llm: ctx.resolveLlmCompleter(),
            agentRuns: ctx.agentRuns,
            agentRunSteps: ctx.agentRunSteps,
          });
          return jsonToolContent(result);
        }

        const input = resolveSimulateReplyInput(buildSimulateBody(args), {
          scenarioStore: ctx.simulatorScenarioStore,
        });
        const result = await simulateReply(input, {
          personaStore: ctx.replyPersonaStore,
          agentContentStore: ctx.agentContentStore,
          llm: ctx.resolveLlmCompleter(),
          agentRuns: ctx.agentRuns,
          agentRunSteps: ctx.agentRunSteps,
        });
        return jsonToolContent(result);
      } catch (error) {
        if (error instanceof ValidationError) {
          return toolError(error.message);
        }
        return toolError(error instanceof Error ? error.message : "simulate failed");
      }
    },
  );
}
