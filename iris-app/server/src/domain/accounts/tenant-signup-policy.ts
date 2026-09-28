export const TENANT_SIGNUP_MODES = ["open", "allowlist", "closed"] as const;

export type TenantSignupMode = (typeof TENANT_SIGNUP_MODES)[number];

export function assertTenantSignupConfig(env: NodeJS.ProcessEnv = process.env): void {
  const mode = resolveSignupMode(env);
  if (mode === "allowlist" && resolveAllowedEmails(env).size === 0) {
    throw new Error(
      "IRIS_ADMIN_EMAIL or IRIS_ALLOWED_EMAILS is required when IRIS_TENANT_SIGNUP=allowlist",
    );
  }
}

export function signupAllows(
  input: { email: string; hasAccount: boolean },
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const mode = resolveSignupMode(env);
  if (mode === "open") {
    return true;
  }

  if (mode === "closed") {
    return input.hasAccount;
  }

  return resolveAllowedEmails(env).has(normalizeEmail(input.email));
}

function resolveSignupMode(env: NodeJS.ProcessEnv): TenantSignupMode {
  const value = env.IRIS_TENANT_SIGNUP?.trim().toLowerCase() ?? "";
  if (!value) {
    if (env.NODE_ENV === "production") {
      throw new Error(
        "IRIS_TENANT_SIGNUP is required in production (open, allowlist, or closed)",
      );
    }
    return "open";
  }

  if (isTenantSignupMode(value)) {
    return value;
  }

  throw new Error("IRIS_TENANT_SIGNUP must be open, allowlist, or closed");
}

function isTenantSignupMode(value: string): value is TenantSignupMode {
  return (TENANT_SIGNUP_MODES as readonly string[]).includes(value);
}

function resolveAllowedEmails(env: NodeJS.ProcessEnv): Set<string> {
  const allowed = new Set<string>();
  const admin = normalizeEmail(env.IRIS_ADMIN_EMAIL ?? "");
  if (admin.includes("@")) {
    allowed.add(admin);
  }

  for (const part of (env.IRIS_ALLOWED_EMAILS ?? "").split(/[,;\s]+/)) {
    const email = normalizeEmail(part);
    if (email.includes("@")) {
      allowed.add(email);
    }
  }

  return allowed;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
