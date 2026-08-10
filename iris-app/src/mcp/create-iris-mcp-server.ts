import { registerAssetTools } from "./tools/register-asset-tools.ts";
import { registerCommentTools } from "./tools/register-comment-tools.ts";
import { registerPostTools } from "./tools/register-post-tools.ts";
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

  return server;
}
