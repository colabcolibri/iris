export type TenancyMode = "off" | "local";

export type TenancyConfig = {
  enabled: boolean;
  mode: TenancyMode;
};

export function localTenancyConfig(): TenancyConfig {
  return { enabled: true, mode: "local" };
}

export function readTenancyConfig(
  env: NodeJS.ProcessEnv = process.env,
): TenancyConfig {
  if (env.IRIS_TENANCY?.trim().toLowerCase() === "local") {
    return localTenancyConfig();
  }

  return { enabled: false, mode: "off" };
}
