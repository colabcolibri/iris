import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../../api/app-context.ts";
import { ValidationError } from "../../api/json.ts";
import {
  getAgentContentPayload,
  normalizeAgentContentBody,
  serializeAgentContent,
} from "../../domain/settings/agent-content.ts";
import {
  getMessageAgentContentPayload,
  normalizeMessageAgentContentBody,
  serializeMessageAgentContent,
} from "../../domain/settings/message-agent-content.ts";
import { getMessageAgentContentOrDefault } from "../../domain/settings/message-agent-content-defaults.ts";
import {
  getReplyPersonaPayload,
  mergePartialPersonaBody,
  normalizePersonaBody,
  resolvePersonaForPartialUpdate,
  serializePersona,
} from "../../domain/settings/reply-persona-mutations.ts";
import { jsonToolContent, toolError } from "../tool-response.ts";

export function registerSettingsPersonaTools(server: McpServer, ctx: AppContext): void {
  server.tool(
    "iris_get_reply_persona",
    "Get reply persona settings (brand, signature, language, max chars)",
    {},
    async () => {
      return jsonToolContent(getReplyPersonaPayload(ctx.replyPersonaStore));
    },
  );

  server.tool(
    "iris_update_reply_persona",
    "Update reply persona settings (partial fields accepted)",
    {
      brand_name: z.string().nullable().optional(),
      signature_instruction: z.string().optional(),
      response_language: z.string().optional(),
      max_chars: z.number().int().optional(),
    },
    async (args) => {
      try {
        const current = resolvePersonaForPartialUpdate(ctx.replyPersonaStore);
        const merged = mergePartialPersonaBody(current, args);
        const input = normalizePersonaBody(merged);
        const saved = ctx.replyPersonaStore.upsert(input);
        return jsonToolContent(serializePersona(saved));
      } catch (error) {
        if (error instanceof ValidationError) {
          return toolError(error.message);
        }
        return toolError(error instanceof Error ? error.message : "update failed");
      }
    },
  );

  server.tool(
    "iris_get_agent_content",
    "Get agent editorial Markdown blocks (soul, page, knowledge, restrictions)",
    {},
    async () => {
      return jsonToolContent(getAgentContentPayload(ctx.agentContentStore));
    },
  );

  server.tool(
    "iris_update_agent_content",
    "Update agent editorial Markdown blocks (all four fields required)",
    {
      soul: z.string(),
      page: z.string(),
      knowledge: z.string(),
      restrictions: z.string(),
    },
    async (args) => {
      try {
        const input = normalizeAgentContentBody(args);
        const saved = ctx.agentContentStore.upsert(input);
        return jsonToolContent(serializeAgentContent(saved));
      } catch (error) {
        if (error instanceof ValidationError) {
          return toolError(error.message);
        }
        return toolError(error instanceof Error ? error.message : "update failed");
      }
    },
  );

  server.tool(
    "iris_get_message_agent_content",
    "Get DM agent editorial Markdown blocks (dm_soul, dm_page, dm_knowledge, dm_restrictions)",
    {},
    async () => {
      return jsonToolContent(getMessageAgentContentPayload(ctx.messageAgentContentStore));
    },
  );

  server.tool(
    "iris_update_message_agent_content",
    "Update DM agent editorial Markdown blocks (partial fields accepted)",
    {
      dm_soul: z.string().optional(),
      dm_page: z.string().optional(),
      dm_knowledge: z.string().optional(),
      dm_restrictions: z.string().optional(),
    },
    async (args) => {
      try {
        const current = getMessageAgentContentOrDefault(ctx.messageAgentContentStore);
        const input = normalizeMessageAgentContentBody(args, current);
        const saved = ctx.messageAgentContentStore.upsert(input);
        return jsonToolContent(serializeMessageAgentContent(saved));
      } catch (error) {
        if (error instanceof ValidationError) {
          return toolError(error.message);
        }
        return toolError(error instanceof Error ? error.message : "update failed");
      }
    },
  );
}
