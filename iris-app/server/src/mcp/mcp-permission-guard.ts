import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  isMcpActionAllowed,
  resolveMcpPermissionPolicy,
  type McpPermissionPolicy,
} from "../domain/mcp/mcp-permission-policy.ts";
import { getMcpToolPermissionMeta } from "../domain/mcp/mcp-tool-catalog.ts";
import { toolError } from "./tool-response.ts";

export function resolveActiveMcpPermissionPolicy(
  stored: { preset: string; domainOverridesJson: string | null } | null,
): McpPermissionPolicy {
  if (!stored) {
    return resolveMcpPermissionPolicy(null);
  }

  let domainOverrides: McpPermissionPolicy["domainOverrides"];
  if (stored.domainOverridesJson) {
    domainOverrides = JSON.parse(stored.domainOverridesJson) as McpPermissionPolicy["domainOverrides"];
  }

  return resolveMcpPermissionPolicy({
    preset: stored.preset as McpPermissionPolicy["preset"],
    domainOverrides,
  });
}

export function isMcpToolCallAllowed(
  policy: McpPermissionPolicy,
  toolName: string,
): boolean {
  const meta = getMcpToolPermissionMeta(toolName);
  if (!meta) {
    return true;
  }

  return isMcpActionAllowed(policy, meta.domain, meta.action);
}

export function mcpToolPermissionDeniedMessage(toolName: string): string | null {
  const meta = getMcpToolPermissionMeta(toolName);
  if (!meta) {
    return null;
  }

  return `permission denied: ${meta.domain}:${meta.action}`;
}

export function wrapMcpServerWithPermissionPolicy(
  server: McpServer,
  policy: McpPermissionPolicy,
): McpServer {
  const originalTool = server.tool.bind(server);

  server.tool = ((name: string, ...rest: unknown[]) => {
    const meta = getMcpToolPermissionMeta(name);
    if (meta && !isMcpActionAllowed(policy, meta.domain, meta.action)) {
      return undefined;
    }

    const handler = rest[rest.length - 1];
    if (meta && typeof handler === "function") {
      const guardedHandler = async (...args: unknown[]) => {
        if (!isMcpActionAllowed(policy, meta.domain, meta.action)) {
          return toolError(`permission denied: ${meta.domain}:${meta.action}`);
        }

        return handler(...args);
      };

      return originalTool(name, ...rest.slice(0, -1), guardedHandler);
    }

    return originalTool(name, ...rest);
  }) as typeof server.tool;

  return server;
}
