import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  LandingSection,
  LandingSectionIntro,
} from "@/components/landing/landing-section";
import { useLandingI18n } from "@/i18n/landing-context";
import { LANDING_SECTIONS } from "@/i18n/routing";

type FormState = "idle" | "pending" | "done" | "error";

const MIN_MESSAGE = 10;
const MAX_MESSAGE = 4000;

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

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setErrorMessage(payload?.error ?? form.genericError);
      setState("error");
    } catch {
      setErrorMessage(form.genericError);
      setState("error");
    }
  }

  return (
    <LandingSection id={LANDING_SECTIONS.contact} tone="canvas">
      <div className="iris-contact-stack mx-auto w-full min-w-0 max-w-xl">
        <LandingSectionIntro
          eyebrow={m.contact.sectionLabel}
          title={
            <>
              {m.contact.title}{" "}
              <span className="italic text-(--iris-primary)">
                {m.contact.titleAccent}
              </span>
            </>
          }
        />

        <p className="mt-4 text-base leading-normal text-(--iris-ink-soft)">
          {m.contact.bodyBeforeEmail}{" "}
          <span className="font-medium text-(--iris-ink)">
            {m.contact.email}
          </span>
          {m.contact.bodyAfterEmail}
        </p>

        <div className="iris-contact-form-wrap">
          {state === "done" ? (
            <p
              role="status"
              className="text-base leading-normal text-(--iris-ink)"
            >
              {form.success}
            </p>
          ) : (
            <form onSubmit={onSubmit} className="iris-contact-form">
              <div
                className="absolute left-[-9999px] h-px w-px overflow-hidden"
                aria-hidden
              >
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

              <div className="iris-form-field">
                <label htmlFor="contact-name" className="iris-form-label">
                  {form.name}
                </label>
                <input
                  id="contact-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                  disabled={pending}
                  className="iris-form-input"
                />
              </div>

              <div className="iris-form-field">
                <label htmlFor="contact-email" className="iris-form-label">
                  {form.email}
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  disabled={pending}
                  className="iris-form-input"
                />
              </div>

              <div className="iris-form-field">
                <label htmlFor="contact-subject" className="iris-form-label">
                  {form.subject}
                </label>
                <input
                  id="contact-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  required
                  disabled={pending}
                  className="iris-form-input"
                />
              </div>

              <div className="iris-form-field">
                <label htmlFor="contact-message" className="iris-form-label">
                  {form.message}
                </label>
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={6}
                  maxLength={MAX_MESSAGE}
                  required
                  disabled={pending}
                  className="iris-form-input iris-form-textarea"
                />
                <p className="iris-form-meta">
                  {message.length}/{MAX_MESSAGE}
                </p>
              </div>

              {errorMessage ? (
                <p role="alert" className="iris-form-error">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="iris-form-submit"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {form.submitting}
                  </>
                ) : (
                  form.submit
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </LandingSection>
  );
}
