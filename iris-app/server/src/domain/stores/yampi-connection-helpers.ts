import type { StoreCredentials } from "./store-types.ts";

export const YAMPI_ALIAS_SETTINGS_KEY = "yampi_alias";

export function readYampiAliasFromSettings(
  settings: Record<string, unknown>,
): string | null {
  const value = settings[YAMPI_ALIAS_SETTINGS_KEY];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function withYampiAliasInSettings(
  settings: Record<string, unknown>,
  alias: string,
): Record<string, unknown> {
  return {
    ...settings,
    [YAMPI_ALIAS_SETTINGS_KEY]: alias.trim(),
  };
}

export function applyResolvedYampiAlias(
  credentials: StoreCredentials,
  resolvedAlias: string | null,
): StoreCredentials {
  if (credentials.providerType !== "yampi" || !resolvedAlias?.trim()) {
    return credentials;
  }

  return {
    providerType: "yampi",
    yampi: {
      ...credentials.yampi,
      alias: resolvedAlias.trim(),
    },
  };
}

export function readStoredYampiAlias(
  settings: Record<string, unknown>,
  credentials: StoreCredentials | null,
): string | null {
  return (
    readYampiAliasFromSettings(settings) ??
    (credentials?.providerType === "yampi" ? credentials.yampi.alias.trim() || null : null)
  );
}
