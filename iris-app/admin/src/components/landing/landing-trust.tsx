import { useLandingI18n } from "@/i18n/landing-context";
import { LANDING_SECTIONS } from "@/i18n/routing";
import { LandingSection, LandingSectionIntro } from "@/components/landing/landing-section";

export function LandingTrust() {
  const { m } = useLandingI18n();

  return (
    <LandingSection id={LANDING_SECTIONS.trust} tone="dark">
      <LandingSectionIntro
        onDark
        eyebrow={m.trust.sectionLabel}
        title={
          <>
            <span className="block">{m.trust.titleLine1}</span>
            <span className="block italic text-[color:var(--iris-primary-on-dark)]">
              {m.trust.titleLine2}
            </span>
          </>
        }
        subtitle={m.trust.subtitle}
        className="max-w-3xl"
      />

      <ol className="mt-14 divide-y divide-white/10 border-y border-white/10">
        {m.trust.items.map((item, index) => (
          <li key={item.title} className="flex flex-col gap-2 py-7 sm:flex-row sm:items-baseline sm:gap-8">
            <span className="font-display text-sm text-[color:var(--iris-primary-on-dark)] sm:w-10 sm:shrink-0">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 sm:flex sm:flex-1 sm:items-baseline sm:gap-8">
              <h3 className="font-display text-xl font-semibold text-[color:var(--iris-ink-on-dark)] sm:w-64 sm:shrink-0">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--iris-ink-muted-on-dark)] sm:mt-0 sm:text-base sm:leading-[1.55]">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </LandingSection>
  );
}
