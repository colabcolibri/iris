import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmLoginCode, requestLoginCode } from "@/lib/api";
import { useAuthSession } from "@/contexts/auth-session-context";

type Step = "email" | "code";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useAuthSession();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode(resend = false) {
    const value = email.trim();
    if (!value) {
      setFeedback("Informe um email válido.");
      return;
    }

    setLoading(true);
    setFeedback("");
    try {
      await requestLoginCode(value);
      setStep("code");
      if (resend) setFeedback("Código reenviado.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Não foi possível enviar o código.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmCode(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setFeedback("Digite os 6 dígitos do código.");
      return;
    }

    setLoading(true);
    setFeedback("");
    try {
      await confirmLoginCode(email.trim(), code.trim());
      await refresh();
      const returnUrl = searchParams.get("returnUrl");
      navigate(returnUrl && returnUrl.startsWith("/") ? returnUrl : "/", { replace: true });
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <main className="w-full max-w-md">
        <div className="flex flex-col gap-6 rounded-xl border border-border/80 bg-card p-8 shadow-[0_8px_40px_-12px_rgba(26,24,20,0.18)]">
          <div className="flex flex-col items-center gap-4 text-center">
            <BrandLogo size="lg" className="ring-0" />
            <div className="space-y-1">
              <h1 className="font-display text-4xl font-semibold tracking-tight">Iris</h1>
              <p className="text-base text-muted-foreground">
                {step === "email" ? "Entrar com seu email" : `Código enviado para ${email}`}
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
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-0 border-b bg-muted/80 focus-visible:ring-0"
                  required
                />
              </div>
              <Button type="submit" className="w-full rounded-lg" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 size-4" />
                )}
                Continuar
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={confirmCode}>
              <div className="space-y-2">
                <Label htmlFor="code">Código de 6 dígitos</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="border-0 border-b bg-muted/80 text-center text-lg tracking-[0.3em] focus-visible:ring-0"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full rounded-lg" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Entrar
              </Button>
              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setStep("email")}
                >
                  Trocar email
                </button>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => void sendCode(true)}
                >
                  Reenviar código
                </button>
              </div>
            </form>
          )}

          {feedback && (
            <p className="text-center text-sm text-muted-foreground">{feedback}</p>
          )}

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground hover:underline">
              Política de privacidade
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
