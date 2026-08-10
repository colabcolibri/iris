import { timingSafeStringEqual } from "./secret-compare.ts";

export const DEV_MCP_CONNECTION_CODE_DEFAULT = "dev-mcp-connection-code-change-me";

export class McpConnectionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpConnectionConfigError";
  }
}

export type McpConfig = {
  connectionCode: string;
};

export function loadMcpConnectionCodeFromEnv(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): string {
  const raw = process.env.IRIS_MCP_CONNECTION_CODE?.trim() ?? "";
  if (raw) {
    return raw;
  }

  if (nodeEnv === "production") {
    return "";
  }

  return DEV_MCP_CONNECTION_CODE_DEFAULT;
}

export function assertMcpConnectionCodeConfigured(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  code?: string,
): void {
  const resolved = (code ?? loadMcpConnectionCodeFromEnv(nodeEnv)).trim();
  if (!resolved) {
    throw new McpConnectionConfigError(
      "IRIS_MCP_CONNECTION_CODE is required in production. Generate with: openssl rand -hex 32",
    );
  }
}

export function validateMcpConnectionCode(
  provided: string | null | undefined,
  expected: string,
): boolean {
  if (!provided?.trim() || !expected.trim()) {
    return false;
  }

  return timingSafeStringEqual(provided, expected);
}
