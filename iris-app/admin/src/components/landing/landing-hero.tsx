import { useLandingI18n } from "@/i18n/landing-context";
import { LANDING_SECTIONS } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";
import { BrandLogo } from "@/components/layout/brand-logo";
import { LandingHeroStage } from "@/components/landing/landing-hero-stage";
import { LandingPrimaryCta } from "@/components/landing/landing-section";

export function LandingHero() {
  const { m } = useLandingI18n();

  return (
    <section className="iris-hero relative overflow-hidden bg-[color:var(--iris-canvas-parchment)] pt-32 pb-[var(--iris-section-y)] sm:pt-40 lg:pt-48 lg:pb-[var(--iris-section-y-lg)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-5%,rgba(82,37,135,0.1),transparent_60%)]"
      />

      <div className="relative mx-auto grid w-full min-w-0 max-w-[var(--iris-container)] grid-cols-1 items-center gap-14 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-16 lg:px-8">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-3">
            <BrandLogo size="lg" className="size-12 sm:size-14" />
            <span className="font-display text-2xl font-semibold tracking-tight text-[color:var(--iris-ink)] sm:text-3xl">
              {m.brand.name}
            </span>
          </div>

          <p className="iris-eyebrow mt-6">{m.hero.eyebrow}</p>

          <h1 className="mt-4 font-display text-[2rem] leading-[1.05] font-semibold tracking-[-0.02em] text-[color:var(--iris-ink)] sm:text-[2.75rem] lg:text-[3.1rem]">
            <span className="block whitespace-nowrap">{m.hero.titleLine1}</span>
            <span className="mt-1 block whitespace-nowrap italic text-[color:var(--iris-primary)]">
              {m.hero.titleLine2Accent}
            </span>
            <span className="mt-1 block whitespace-nowrap">
              {m.hero.titleLine2}
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-normal text-[color:var(--iris-ink-soft)] sm:text-lg sm:leading-[1.55]">
            {m.hero.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <LandingPrimaryCta href={`#${LANDING_SECTIONS.contact}`}>
              {m.hero.cta}
            </LandingPrimaryCta>
            <LandingPrimaryCta href={ROUTES.demo.root} variant="ghost">
              {m.hero.demoCta}
            </LandingPrimaryCta>
          </div>
        </div>

        <div className="min-w-0">
          <LandingHeroStage />
        </div>
      </div>
    </section>
  );
}
