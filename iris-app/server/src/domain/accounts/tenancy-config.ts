export type TenancyMode = "off" | "local";

export type TenancyConfig = {
  enabled: boolean;
  mode: TenancyMode;
};

export function localTenancyConfig(): TenancyConfig {
  return { enabled: true, mode: "local" };
}

export function tenancyOff(): TenancyConfig {
  return { enabled: false, mode: "off" };
}
