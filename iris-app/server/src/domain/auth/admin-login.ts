import type { EmailSender } from "../../ports/email-sender.ts";
import type { AdminLoginChallengeRepository } from "../../adapters/sqlite/admin-login-challenge-repository.ts";
import type { ServerAppLocale } from "../../i18n/locale.ts";
import { buildAdminLoginEmailContent } from "./admin-login-email.ts";
import {
  ADMIN_OTP_MAX_ATTEMPTS,
  ADMIN_OTP_RESEND_SECONDS,
  generateOtpCode,
  hashOtpCode,
  hasActiveOtpResendCooldown,
  isEmailAllowlisted,
  normalizeAdminEmail,
  normalizeOtpCodeInput,
  otpPepper,
  resolveOtpTtlMs,
  verifyOtpCode,
} from "./admin-otp-code.ts";

export type AdminLoginErrorCode =
  | "code_invalid"
  | "code_expired"
  | "rate_limited"
  | "too_many_attempts"
  | "email_failed"
  | "email_not_configured"
  | "security_not_configured";

export class AdminLoginError extends Error {
  readonly code: AdminLoginErrorCode;

  constructor(code: AdminLoginErrorCode, message: string) {
    super(message);
    this.name = "AdminLoginError";
    this.code = code;
  }
}

export type AdminLoginDeps = {
  challenges: AdminLoginChallengeRepository;
  emailSender: EmailSender;
  locale?: ServerAppLocale;
  allowUnlistedEmail?: boolean;
};

const GENERIC_MESSAGE =
  "Se o email estiver autorizado, você receberá um código em instantes.";

export async function requestAdminLoginCode(
  rawEmail: string,
  deps: AdminLoginDeps,
): Promise<{ sent: boolean; message: string }> {
  const email = normalizeAdminEmail(rawEmail);

  if (!email.includes("@")) {
    return { sent: true, message: GENERIC_MESSAGE };
  }

  if (!deps.allowUnlistedEmail && !isEmailAllowlisted(email)) {
    return { sent: true, message: GENERIC_MESSAGE };
  }

  try {
    // Fail closed: never issue or send an OTP without the production pepper.
    otpPepper();
  } catch {
    throw new AdminLoginError(
      "security_not_configured",
      "Login temporariamente indisponível: configuração de segurança ausente.",
    );
  }

  const existing = deps.challenges.find(email);
  if (hasActiveOtpResendCooldown(existing)) {
    throw new AdminLoginError(
      "rate_limited",
      `Aguarde ${ADMIN_OTP_RESEND_SECONDS}s antes de reenviar o código.`,
    );
  }

  const code = generateOtpCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + resolveOtpTtlMs()).toISOString();
  const ttlMinutes = Math.round(resolveOtpTtlMs() / 60_000);
  const content = buildAdminLoginEmailContent({
    code,
    ttlMinutes,
    locale: deps.locale,
  });

  const sendResult = await deps.emailSender.send({
    to: email,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });

  if (!sendResult.ok) {
    const message = sendResult.error ?? "Falha ao enviar email.";
    if (/RESEND_API_KEY|IRIS_EMAIL_PROVIDER|não configurado/i.test(message)) {
      throw new AdminLoginError("email_not_configured", message);
    }
    throw new AdminLoginError("email_failed", message);
  }

  deps.challenges.upsert({
    email,
    codeHash: hashOtpCode(code),
    expiresAt,
    attempts: 0,
    lastRequestAt: now.toISOString(),
  });

  return { sent: true, message: GENERIC_MESSAGE };
}

export async function confirmAdminLoginCode(
  rawEmail: string,
  rawCode: string,
  deps: AdminLoginDeps,
): Promise<{ email: string }> {
  const email = normalizeAdminEmail(rawEmail);
  let code: string;

  try {
    otpPepper();
  } catch {
    throw new AdminLoginError(
      "security_not_configured",
      "Login temporariamente indisponível: configuração de segurança ausente.",
    );
  }

  try {
    code = normalizeOtpCodeInput(rawCode);
  } catch {
    throw new AdminLoginError("code_invalid", "Código inválido.");
  }

  const record = deps.challenges.find(email);
  if (!record) {
    throw new AdminLoginError("code_invalid", "Código inválido.");
  }

  if (Date.now() > new Date(record.expiresAt).getTime()) {
    deps.challenges.delete(email);
    throw new AdminLoginError("code_expired", "Código expirado.");
  }

  if (record.attempts >= ADMIN_OTP_MAX_ATTEMPTS) {
    throw new AdminLoginError("too_many_attempts", "Muitas tentativas. Solicite um novo código.");
  }

  if (!verifyOtpCode(code, record.codeHash)) {
    deps.challenges.upsert({
      ...record,
      attempts: record.attempts + 1,
    });
    if (record.attempts + 1 >= ADMIN_OTP_MAX_ATTEMPTS) {
      throw new AdminLoginError("too_many_attempts", "Muitas tentativas. Solicite um novo código.");
    }
    throw new AdminLoginError("code_invalid", "Código inválido.");
  }

  deps.challenges.delete(email);
  return { email };
}
