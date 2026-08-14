import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmLoginCode, requestLoginCode } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAuthSession } from "@/contexts/auth-session-context";
import { interpolate } from "@/i18n/compose";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { ROUTES, privacyPath } from "@/lib/routes";

type Step = "email" | "code";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useAuthSession();
  const { locale } = useAppLocale();
  const shell = useDomainMessages("shell");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode(resend = false) {
    const value = email.trim();
    if (!value) {
      setFeedback(shell.login.invalidEmail);
      return;
    }

    setLoading(true);
    setFeedback("");
    try {
      await requestLoginCode(value, locale);
      setStep("code");
      if (resend) setFeedback(shell.login.codeResent);
    } catch (err) {
      setFeedback(getApiErrorMessage(err, locale) || shell.login.sendCodeFailed);
    } finally {
      setLoading(false);
    }
  }

  async function confirmCode(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setFeedback(shell.login.invalidCodeDigits);
      return;
    }

    setLoading(true);
    setFeedback("");
    try {
      await confirmLoginCode(email.trim(), code.trim());
      const ok = await refresh({ silent: true });
      if (!ok) {
        setFeedback(shell.login.sessionNotCreated);
        return;
      }
      const returnUrl = searchParams.get("returnUrl");
      const safeReturn =
        returnUrl &&
        returnUrl.startsWith("/") &&
        !returnUrl.startsWith("//") &&
        !returnUrl.startsWith(ROUTES.admin.login)
          ? returnUrl
          : ROUTES.admin.root;
      navigate(safeReturn, { replace: true });
    } catch (err) {
      setFeedback(
        getApiErrorMessage(err, locale) || shell.login.invalidOrExpiredCode,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <main className="w-full max-w-md">
        <div className="flex flex-col gap-6 rounded-[var(--iris-radius-lg)] border border-border bg-card p-8 shadow-none">
          <div className="flex flex-col items-center gap-4 text-center">
            <BrandLogo size="lg" className="ring-0" />
            <div className="space-y-1">
              <h1 className="font-display text-4xl font-semibold tracking-tight">
                iris
              </h1>
              <p className="text-base text-muted-foreground">
                {step === "email"
                  ? shell.login.titleEmail
                  : interpolate(shell.login.titleCode, { email })}
              </p>
            </div>
          </div>

          {step === "email" ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void sendCode();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">
                  {shell.login.emailLabel}
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 size-4" />
                )}
                {shell.login.continue}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={confirmCode}>
              <div className="space-y-2">
                <Label htmlFor="code">{shell.login.codeLabel}</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="text-center text-lg tracking-[0.3em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {shell.login.signIn}
              </Button>
              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setStep("email")}
                >
                  {shell.login.changeEmail}
                </button>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => void sendCode(true)}
                >
                  {shell.login.resendCode}
                </button>
              </div>
            </form>
          )}

          {feedback && (
            <p className="text-center text-sm text-muted-foreground">
              {feedback}
            </p>
          )}

          <p className="text-center text-xs text-muted-foreground">
            <Link
              to={privacyPath(locale)}
              className="hover:text-foreground hover:underline"
            >
              {shell.login.privacyLink}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
