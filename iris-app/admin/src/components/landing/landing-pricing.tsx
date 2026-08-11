import { useLandingI18n } from "@/i18n/landing-context";
import { LANDING_SECTIONS } from "@/i18n/routing";
import { LandingSection, LandingSectionIntro } from "@/components/landing/landing-section";

export function LandingPricing() {
  const { m } = useLandingI18n();

  return (
    <LandingSection id={LANDING_SECTIONS.pricing} tone="canvas">
      <LandingSectionIntro
        eyebrow={m.pricing.sectionLabel}
        title={
          <>
            <span className="block">{m.pricing.titleLine1}</span>
            <span className="block italic text-[color:var(--iris-primary)]">{m.pricing.titleLine2}</span>
          </>
        }
        className="max-w-3xl"
      />
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-[color:var(--iris-ink-soft)] sm:text-lg sm:leading-[1.55]">
        {m.pricing.subtitle}
        <br />
        {m.pricing.manifestoNote}
      </p>

      <ol className="mt-10 divide-y divide-[color:var(--iris-hairline)] border-y border-[color:var(--iris-hairline)]">
        {m.pricing.items.map((item, index) => (
          <li
            key={item.title}
            className="flex flex-col gap-2 py-7 sm:flex-row sm:items-baseline sm:gap-8"
          >
            <span className="font-display text-sm text-[color:var(--iris-ink-muted)] sm:w-10 sm:shrink-0">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 sm:flex sm:flex-1 sm:items-baseline sm:gap-8">
              <h3 className="font-display text-xl font-semibold text-[color:var(--iris-ink)] sm:w-64 sm:shrink-0">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--iris-ink-soft)] sm:mt-0 sm:text-base sm:leading-[1.55]">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 border-l-2 border-[color:var(--iris-primary)] pl-6 sm:pl-8">
        <p className="font-display text-xl leading-[1.3] font-semibold italic text-[color:var(--iris-ink)] sm:text-2xl lg:text-[1.75rem]">
          {m.pricing.manifestoQuestion}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-[color:var(--iris-ink-soft)] sm:text-base sm:leading-[1.55]">
          {m.pricing.manifestoAnswer}
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-3 border-t border-[color:var(--iris-hairline)] pt-8 sm:flex-row sm:items-start sm:gap-8">
        <p className="shrink-0 text-xs font-semibold tracking-[0.14em] text-[color:var(--iris-ink-muted)] uppercase">
          {m.pricing.noteLabel}
        </p>
        <p className="max-w-2xl text-sm leading-relaxed text-[color:var(--iris-ink-soft)] sm:text-base sm:leading-[1.55]">
          {m.pricing.note}
        </p>
      </div>
    </LandingSection>
  );
}
