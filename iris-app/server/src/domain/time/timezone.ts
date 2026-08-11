export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

function readEnvTimezone(): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env;
  return env?.IRIS_DEFAULT_TIMEZONE;
}

export type TimezoneOption = {
  value: string;
  label: string;
};

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Fortaleza", label: "Fortaleza (GMT-3)" },
  { value: "America/Recife", label: "Recife (GMT-3)" },
  { value: "America/Cuiaba", label: "Cuiabá (GMT-4)" },
  { value: "America/Belem", label: "Belém (GMT-3)" },
  { value: "America/Noronha", label: "Fernando de Noronha (GMT-2)" },
  { value: "America/New_York", label: "Nova York (GMT-5/-4)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8/-7)" },
  { value: "Europe/Lisbon", label: "Lisboa (GMT+0/+1)" },
  { value: "Europe/London", label: "Londres (GMT+0/+1)" },
  { value: "Europe/Paris", label: "Paris (GMT+1/+2)" },
  { value: "UTC", label: "UTC" },
];

export function isValidIanaTimeZone(timeZone: string): boolean {
  if (!timeZone.trim()) {
    return false;
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(value: string | null | undefined): string {
  if (value && isValidIanaTimeZone(value)) {
    return value;
  }

  const fromEnv = readEnvTimezone();
  if (fromEnv && isValidIanaTimeZone(fromEnv)) {
    return fromEnv;
  }

  return DEFAULT_TIMEZONE;
}
