import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormState = "idle" | "pending" | "done" | "error";

const MIN_MESSAGE = 10;
const MAX_MESSAGE = 4000;

export function LandingContact() {
  const honeypotId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pending = state === "pending";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || state === "done") return;

    if (
      !name.trim() ||
      !email.trim() ||
      !subject.trim() ||
      message.trim().length < MIN_MESSAGE
    ) {
      setErrorMessage("Preencha todos os campos. A mensagem precisa ter pelo menos 10 caracteres.");
      setState("error");
      return;
    }

    setState("pending");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          pageUrl: window.location.href,
          website,
        }),
      });

      if (response.ok) {
        setState("done");
        return;
      }

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setErrorMessage(payload?.error ?? "Não foi possível enviar agora. Tente novamente em instantes.");
      setState("error");
    } catch {
      setErrorMessage("Não foi possível enviar agora. Tente novamente em instantes.");
      setState("error");
    }
  }

  return (
    <section id="contato" className="border-t border-[color:var(--iris-lp-rule)] bg-[color:var(--iris-lp-panel)]/50">
      <div className="mx-auto grid w-full min-w-0 max-w-[1200px] grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16 lg:px-8 lg:py-24">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--iris-lp-muted)] uppercase">
            04 · Contato
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-[color:var(--iris-lp-text)] sm:text-4xl">
            Tem interesse?{" "}
            <span className="italic text-[color:var(--iris-lp-primary)]">Vamos conversar</span>
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[color:var(--iris-lp-text-soft)] sm:text-lg">
            O Iris ainda não tem venda direta por aqui. Se você quer saber mais, pilotar o produto ou
            explorar uma parceria, envie uma mensagem — respondo por email em{" "}
            <a
              href="mailto:ola@sergioluciano.com"
              className="font-medium text-[color:var(--iris-lp-primary)] underline-offset-4 hover:underline"
            >
              ola@sergioluciano.com
            </a>
            .
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-[color:var(--iris-lp-rule)] bg-[color:var(--iris-lp-ink)] p-6 sm:p-8">
          {state === "done" ? (
            <p role="status" className="text-base leading-relaxed text-[color:var(--iris-lp-text)]">
              Obrigado — recebemos sua mensagem e responderemos por email em breve.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
                <label htmlFor={honeypotId}>Website</label>
                <input
                  id={honeypotId}
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Nome</Label>
                  <Input
                    id="contact-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    required
                    disabled={pending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                    disabled={pending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject">Assunto</Label>
                <Input
                  id="contact-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  required
                  disabled={pending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Mensagem</Label>
                <Textarea
                  id="contact-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={6}
                  maxLength={MAX_MESSAGE}
                  required
                  disabled={pending}
                />
                <p className="text-xs text-[color:var(--iris-lp-muted)]">
                  {message.length}/{MAX_MESSAGE}
                </p>
              </div>

              {errorMessage ? (
                <p role="alert" className="text-sm text-destructive">
                  {errorMessage}
                </p>
              ) : null}

              <Button type="submit" disabled={pending} className="h-11">
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar mensagem"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
