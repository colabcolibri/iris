import { registerAssetTools } from "./tools/register-asset-tools.ts";
import { registerCommentTools } from "./tools/register-comment-tools.ts";
import { registerMessageTools } from "./tools/register-message-tools.ts";
import { registerPostTools } from "./tools/register-post-tools.ts";
import { registerInsightsTools } from "./tools/register-insights-tools.ts";
import { registerSettingsAppTools } from "./tools/register-settings-app-tools.ts";
import { registerWebhookTools } from "./tools/register-webhook-tools.ts";
import { registerProductTools } from "./tools/register-product-tools.ts";
import { registerStoreTools } from "./tools/register-store-tools.ts";
import { registerSettingsPersonaTools } from "./tools/register-settings-persona-tools.ts";
import { registerSimulatorTools } from "./tools/register-simulator-tools.ts";
import type { AppContext } from "../api/app-context.ts";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  resolveActiveMcpPermissionPolicy,
  wrapMcpServerWithPermissionPolicy,
} from "./mcp-permission-guard.ts";

export function createIrisMcpServer(ctx: AppContext): McpServer {
  const policy = resolveActiveMcpPermissionPolicy(ctx.mcpPermissionStore.get());
  const server = new McpServer({
    name: "iris",
    version: "1.0.0",
  });

  wrapMcpServerWithPermissionPolicy(server, policy);

  registerPostTools(server, ctx);
  registerAssetTools(server, ctx);
  registerCommentTools(server, ctx);
  registerMessageTools(server, ctx);
  registerInsightsTools(server, ctx);
  registerSettingsAppTools(server, ctx);
  registerWebhookTools(server, ctx);
  registerSettingsPersonaTools(server, ctx);
  registerProductTools(server, ctx);
  registerStoreTools(server, ctx);
  registerSimulatorTools(server, ctx);

  return server;
}
