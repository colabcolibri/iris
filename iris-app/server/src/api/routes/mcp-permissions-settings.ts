import { readJsonBody, sendJson } from "../json.ts";
import { createAdminPathRouter } from "../router.ts";
import {
  normalizeMcpPermissionPolicyInput,
  resolveMcpPermissionPolicy,
  serializeMcpPermissionPolicy,
} from "../../domain/mcp/mcp-permission-policy.ts";
import { resolveActiveMcpPermissionPolicy } from "../../mcp/mcp-permission-guard.ts";

export const handleMcpPermissionsSettingsRoute = createAdminPathRouter(
  "/api/settings/mcp/permissions",
  {
    GET: async (match) => {
      const policy = resolveActiveMcpPermissionPolicy(
        match.ctx.mcpPermissionStore.get(),
      );
      const stored = match.ctx.mcpPermissionStore.get();

      sendJson(match.res, 200, {
        ...serializeMcpPermissionPolicy(policy),
        updated_at: stored?.updatedAt ?? null,
      });
    },
    PUT: async (match) => {
      const body = await readJsonBody<unknown>(match.req);
      const input = normalizeMcpPermissionPolicyInput(body);
      const domainOverridesJson = input.domainOverrides
        ? JSON.stringify(input.domainOverrides)
        : null;

      const saved = match.ctx.mcpPermissionStore.upsert({
        preset: input.preset,
        domainOverridesJson,
      });

      const policy = resolveMcpPermissionPolicy({
        preset: saved.preset,
        domainOverrides: input.domainOverrides,
      });

      sendJson(match.res, 200, {
        ...serializeMcpPermissionPolicy(policy),
        updated_at: saved.updatedAt,
      });
    },
  },
);
