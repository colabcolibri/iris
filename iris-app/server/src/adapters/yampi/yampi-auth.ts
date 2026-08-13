import type { YampiCredentials } from "../../domain/stores/store-types.ts";

export type YampiMerchantSummary = {
  alias: string;
  name: string;
  active: boolean;
  domain: string | null;
};

export type YampiAuthMeResult = {
  ok: boolean;
  message: string;
  merchants: YampiMerchantSummary[];
};

export function yampiAuthHeaders(credentials: Pick<YampiCredentials, "userToken" | "userSecretKey">): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Token": credentials.userToken,
    "User-Secret-Key": credentials.userSecretKey,
  };
}

export function parseYampiMerchants(body: unknown): YampiMerchantSummary[] {
  if (!body || typeof body !== "object") {
    return [];
  }

  const data = (body as { data?: unknown }).data;
  if (!data || typeof data !== "object") {
    return [];
  }

  const merchantsNode = (data as { merchants?: unknown }).merchants;
  const rawList = Array.isArray(merchantsNode)
    ? merchantsNode
    : merchantsNode &&
        typeof merchantsNode === "object" &&
        Array.isArray((merchantsNode as { data?: unknown[] }).data)
      ? (merchantsNode as { data: unknown[] }).data
      : [];

  const merchants: YampiMerchantSummary[] = [];
  for (const entry of rawList) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const record = entry as Record<string, unknown>;
    const alias = typeof record.alias === "string" ? record.alias.trim() : "";
    if (!alias) {
      continue;
    }
    merchants.push({
      alias,
      name: typeof record.name === "string" ? record.name.trim() : alias,
      active: record.active !== false,
      domain:
        typeof record.domain === "string" && record.domain.trim()
          ? record.domain.trim()
          : null,
    });
  }

  return merchants;
}

export function resolveYampiAliasFromMerchants(
  merchants: YampiMerchantSummary[],
  requestedAlias?: string,
): { ok: boolean; message: string; resolvedAlias: string | null } {
  const alias = requestedAlias?.trim() ?? "";

  if (!alias) {
    if (merchants.length === 0) {
      return {
        ok: false,
        message: "nenhuma loja encontrada para estas credenciais",
        resolvedAlias: null,
      };
    }
    if (merchants.length === 1) {
      return {
        ok: true,
        message: "alias resolvido automaticamente",
        resolvedAlias: merchants[0]!.alias,
      };
    }
    return {
      ok: false,
      message: "alias é obrigatório: a conta possui mais de uma loja Yampi",
      resolvedAlias: null,
    };
  }

  const match = merchants.find((merchant) => merchant.alias === alias);
  if (!match) {
    const available = merchants.map((merchant) => merchant.alias).join(", ");
    return {
      ok: false,
      message: available
        ? `alias "${alias}" não pertence à conta. Disponíveis: ${available}`
        : `alias "${alias}" não pertence à conta`,
      resolvedAlias: null,
    };
  }

  return {
    ok: true,
    message: "alias validado",
    resolvedAlias: match.alias,
  };
}
