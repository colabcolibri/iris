import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { timingSafeStringEqual } from "./secret-compare.ts";
import { DEV_MCP_CONNECTION_CODE_DEFAULT } from "./mcp-connection.ts";

export function resolveMcpCodePepper(): string {
  const pepper =
    process.env.IRIS_OTP_PEPPER?.trim() ??
    process.env.IRIS_SESSION_SECRET?.trim() ??
    "";

  if (!pepper) {
    throw new Error("IRIS_OTP_PEPPER or IRIS_SESSION_SECRET is required");
  }

  return pepper;
}

export function generateMcpConnectionCode(): string {
  return randomBytes(32).toString("hex");
}

export function hashMcpConnectionCode(
  code: string,
  pepper = resolveMcpCodePepper(),
): string {
  return createHash("sha256").update(`${code.trim()}${pepper}`).digest("hex");
}

export function verifyMcpConnectionCodeHash(
  code: string,
  hash: string,
  pepper = resolveMcpCodePepper(),
): boolean {
  const expected = hashMcpConnectionCode(code, pepper);
  const a = Buffer.from(expected);
  const b = Buffer.from(hash);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function mcpConnectionCodeHint(code: string): string {
  const trimmed = code.trim();
  if (trimmed.length < 4) {
    return "****";
  }
  return `…${trimmed.slice(-4)}`;
}

export type McpConnectionVerifier = {
  isConfigured(): boolean;
  verify(provided: string | null | undefined): boolean;
  configuredSources(): { environment: boolean; database: boolean };
};

export function createMcpConnectionVerifier(deps: {
  envCode: string;
  nodeEnv: string;
  getStoredHash: () => string | null;
  pepper?: () => string;
}): McpConnectionVerifier {
  const pepper = deps.pepper ?? resolveMcpCodePepper;

  function effectiveDevDefault(): string {
    if (deps.nodeEnv === "production") {
      return "";
    }
    return DEV_MCP_CONNECTION_CODE_DEFAULT;
  }

  return {
    configuredSources() {
      return {
        environment: Boolean(deps.envCode.trim()),
        database: Boolean(deps.getStoredHash()),
      };
    },

    isConfigured() {
      if (deps.envCode.trim()) {
        return true;
      }
      if (deps.getStoredHash()) {
        return true;
      }
      return Boolean(effectiveDevDefault());
    },

    verify(provided) {
      if (!provided?.trim()) {
        return false;
      }

      const envCode = deps.envCode.trim() || effectiveDevDefault();
      if (envCode && timingSafeStringEqual(provided, envCode)) {
        return true;
      }

      const storedHash = deps.getStoredHash();
      if (storedHash && verifyMcpConnectionCodeHash(provided, storedHash, pepper())) {
        return true;
      }

      return false;
    },
  };
}
