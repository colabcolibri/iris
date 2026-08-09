import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmLoginCode, requestLoginCode } from "@/lib/api";

type Step = "email" | "code";

export function LoginPage() {
  const navigate = useNavigate();
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
      navigate("/", { replace: true });
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">Iris</CardTitle>
          <p className="text-sm text-muted-foreground">
            {step === "email" ? "Entre com seu email" : `Código enviado para ${email}`}
          </p>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void sendCode();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
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
                  className="text-center text-lg tracking-[0.3em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
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
            <p className="mt-4 text-center text-sm text-muted-foreground">{feedback}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
