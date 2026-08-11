export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
};

const DEFAULT_MAILPIT_SMTP_HOST = "127.0.0.1";
const DEFAULT_MAILPIT_SMTP_PORT = 1025;

function parsePort(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`IRIS_SMTP_PORT inválida: ${raw}`);
  }
  return parsed;
}

function parseSecure(raw: string | undefined): boolean {
  const normalized = raw?.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function resolveSmtpConfig(): SmtpConfig {
  const host = process.env.IRIS_SMTP_HOST?.trim() || DEFAULT_MAILPIT_SMTP_HOST;
  const port = parsePort(process.env.IRIS_SMTP_PORT, DEFAULT_MAILPIT_SMTP_PORT);
  const secure = parseSecure(process.env.IRIS_SMTP_SECURE);
  const user = process.env.IRIS_SMTP_USER?.trim() || undefined;
  const pass = process.env.IRIS_SMTP_PASS?.trim() || undefined;
  return { host, port, secure, user, pass };
}
