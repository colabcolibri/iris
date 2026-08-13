import { registerAssetTools } from "./tools/register-asset-tools.ts";
import { registerCommentTools } from "./tools/register-comment-tools.ts";
import { registerMessageTools } from "./tools/register-message-tools.ts";
import { registerPostTools } from "./tools/register-post-tools.ts";
import { registerInsightsTools } from "./tools/register-insights-tools.ts";
import { registerSettingsAppTools } from "./tools/register-settings-app-tools.ts";
import { registerWebhookTools } from "./tools/register-webhook-tools.ts";
import { registerSettingsPersonaTools } from "./tools/register-settings-persona-tools.ts";
import { registerSimulatorTools } from "./tools/register-simulator-tools.ts";
import type { AppContext } from "../api/app-context.ts";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function createIrisMcpServer(ctx: AppContext): McpServer {
  const server = new McpServer({
    name: "iris",
    version: "1.0.0",
  });

  registerPostTools(server, ctx);
  registerAssetTools(server, ctx);
  registerCommentTools(server, ctx);
  registerMessageTools(server, ctx);
  registerInsightsTools(server, ctx);
  registerSettingsAppTools(server, ctx);
  registerWebhookTools(server, ctx);
  registerSettingsPersonaTools(server, ctx);
  registerSimulatorTools(server, ctx);

  return server;
}
