import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LandingSection, LandingSectionIntro } from "@/components/landing/landing-section";
import { useLandingI18n } from "@/i18n/landing-context";
import { LANDING_SECTIONS } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type FormState = "idle" | "pending" | "done" | "error";

const MIN_MESSAGE = 10;
const MAX_MESSAGE = 4000;

const fieldClass =
  "h-11 rounded-[var(--iris-radius-pill)] border-[color:var(--iris-hairline)] bg-[color:var(--iris-canvas)] px-4 text-[15px] focus-visible:border-[color:var(--iris-primary)] focus-visible:ring-[color:var(--iris-primary)]/20";

export function LandingContact() {
  const { locale, m } = useLandingI18n();
  const honeypotId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pending = state === "pending";
  const form = m.contact.form;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || state === "done") return;

    if (
      !name.trim() ||
      !email.trim() ||
      !subject.trim() ||
      message.trim().length < MIN_MESSAGE
    ) {
      setErrorMessage(form.validationError);
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
          locale,
          pageUrl: window.location.href,
          website,
        }),
      });

      if (response.ok) {
        setState("done");
        return;
      }

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setErrorMessage(payload?.error ?? form.genericError);
      setState("error");
    } catch {
      setErrorMessage(form.genericError);
      setState("error");
    }
  }

  return (
    <LandingSection
      id={LANDING_SECTIONS.contact}
      tone="canvas"
      containerClassName="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16"
    >
      <div className="min-w-0">
        <LandingSectionIntro
          eyebrow={m.contact.sectionLabel}
          title={
            <span className="sm:whitespace-nowrap">
              {m.contact.title}{" "}
              <span className="italic text-[color:var(--iris-primary)]">{m.contact.titleAccent}</span>
            </span>
          }
        />
        <p className="mt-4 max-w-lg text-[17px] leading-[1.47] text-[color:var(--iris-ink-soft)]">
          {m.contact.bodyBeforeEmail}{" "}
          <a
            href={`mailto:${m.contact.email}`}
            className="font-medium text-[color:var(--iris-primary)] underline-offset-4 hover:underline"
          >
            {m.contact.email}
          </a>
          {m.contact.bodyAfterEmail}
        </p>
      </div>

      <div className="iris-utility-card min-w-0 p-6 sm:p-8">
        {state === "done" ? (
          <p role="status" className="text-base leading-[1.47] text-[color:var(--iris-ink)]">
            {form.success}
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

            <div className="space-y-2">
              <Label htmlFor="contact-name" className="text-[color:var(--iris-ink-soft)]">
                {form.name}
              </Label>
              <Input
                id="contact-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
                disabled={pending}
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email" className="text-[color:var(--iris-ink-soft)]">
                {form.email}
              </Label>
              <Input
                id="contact-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                disabled={pending}
                className={fieldClass}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-subject" className="text-[color:var(--iris-ink-soft)]">
                {form.subject}
              </Label>
              <Input
                id="contact-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                required
                disabled={pending}
                className={fieldClass}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-message" className="text-[color:var(--iris-ink-soft)]">
                {form.message}
              </Label>
              <Textarea
                id="contact-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={6}
                maxLength={MAX_MESSAGE}
                required
                disabled={pending}
                className={cn(fieldClass, "min-h-[9rem] rounded-[var(--iris-radius-lg)] py-3")}
              />
              <p className="text-xs text-[color:var(--iris-ink-muted)]">
                {message.length}/{MAX_MESSAGE}
              </p>
            </div>

            {errorMessage ? (
              <p role="alert" className="text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={pending}
              className="h-11 rounded-[var(--iris-radius-pill)] bg-[color:var(--iris-primary)] px-6 text-[15px] font-medium text-[color:var(--iris-on-primary)] hover:bg-[color:var(--iris-primary)]/90 active:scale-[0.98]"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {form.submitting}
                </>
              ) : (
                form.submit
              )}
            </Button>
          </form>
        )}
      </div>
    </LandingSection>
  );
}
