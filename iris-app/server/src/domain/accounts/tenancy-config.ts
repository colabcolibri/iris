export type TenancyMode = "off" | "local" | "turso";

export type TenancyConfig = {
  enabled: boolean;
  mode: TenancyMode;
  org: string;
  platformToken: string;
  group: string;
  location: string;
};

export function readTenancyConfig(
  env: NodeJS.ProcessEnv = process.env,
): TenancyConfig {
  const org = env.TURSO_ORG?.trim() ?? "";
  const platformToken = env.TURSO_PLATFORM_TOKEN?.trim() ?? "";
  const forced = env.IRIS_TENANCY?.trim().toLowerCase() ?? "";
  const group = env.TURSO_GROUP?.trim() || "iris";
  const location = env.TURSO_GROUP_LOCATION?.trim() || "gru";

  if (forced === "local") {
    return {
      enabled: true,
      mode: "local",
      org,
      platformToken,
      group,
      location,
    };
  }

  if (org && platformToken) {
    return {
      enabled: true,
      mode: "turso",
      org,
      platformToken,
      group,
      location,
    };
  }

  return {
    enabled: false,
    mode: "off",
    org,
    platformToken,
    group,
    location,
  };
}
