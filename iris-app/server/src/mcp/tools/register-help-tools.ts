import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  MCP_HELP_TOPICS,
  buildMcpAgentHelp,
} from "../../domain/mcp/mcp-agent-help.ts";
import { jsonToolContent } from "../tool-response.ts";

export function registerHelpTools(server: McpServer): void {
  server.tool(
    "iris_help",
    "Iris MCP guide for AI agents: publish workflow, every post field, app settings, campaign/private-reply rules, asset upload, permissions. Call early in a session. Optional topic narrows the response.",
    {
      topic: z
        .enum(MCP_HELP_TOPICS)
        .optional()
        .describe(
          "overview | publish | post_fields | campaign | app_settings | assets | permissions | tools",
        ),
    },
    async (args) => {
      const help = buildMcpAgentHelp(args.topic);
      return jsonToolContent(help);
    },
  );
}
