import type { McpPermissionPolicyInput } from "../domain/mcp/mcp-permission-policy.ts";

export type McpPermissionSettings = {
  preset: McpPermissionPolicyInput["preset"];
  domainOverridesJson: string | null;
  updatedAt: string;
};

export type McpPermissionStore = {
  get(): McpPermissionSettings | null;
  upsert(input: {
    preset: McpPermissionPolicyInput["preset"];
    domainOverridesJson: string | null;
  }): McpPermissionSettings;
};
