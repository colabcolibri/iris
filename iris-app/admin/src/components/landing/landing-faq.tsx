import { useLandingI18n } from "@/i18n/landing-context";
import { LANDING_SECTIONS } from "@/i18n/routing";
import { LandingSection, LandingSectionIntro } from "@/components/landing/landing-section";

export function LandingFaq() {
  const { m } = useLandingI18n();

  return (
    <LandingSection id={LANDING_SECTIONS.faq} tone="parchment">
      <LandingSectionIntro eyebrow={m.faq.sectionLabel} title={m.faq.title} subtitle={m.faq.subtitle} />

      <div className="mt-10 max-w-3xl divide-y divide-[color:var(--iris-hairline)] border-y border-[color:var(--iris-hairline)]">
        {m.faq.items.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="cursor-pointer list-none text-base font-medium text-[color:var(--iris-ink)] marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-4">
                <span>{item.question}</span>
                <span
                  aria-hidden
                  className="mt-0.5 text-[color:var(--iris-ink-muted)] transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--iris-ink-soft)] sm:text-base sm:leading-[1.47]">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </LandingSection>
  );
}
