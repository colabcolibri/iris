import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/layout/brand-logo";
import { LandingLanguageSwitcher } from "@/components/landing/landing-language-switcher";
import { useLandingI18n } from "@/i18n/landing-context";
import { LANDING_SECTIONS, landingHomePath } from "@/i18n/routing";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

const navLinkClass =
  "text-[color:var(--iris-ink-muted-on-dark)] transition-colors hover:text-[color:var(--iris-ink-on-dark)]";

type LandingNavProps = {
  className?: string;
};

export function LandingNav({ className }: LandingNavProps) {
  const { locale, m } = useLandingI18n();

  const navLinks = [
    { href: `#${LANDING_SECTIONS.howItWorks}`, label: m.nav.howItWorks },
    { href: `#${LANDING_SECTIONS.features}`, label: m.nav.features },
    { href: `#${LANDING_SECTIONS.trust}`, label: m.nav.trust },
    { href: `#${LANDING_SECTIONS.pricing}`, label: m.nav.pricing },
    { href: `#${LANDING_SECTIONS.faq}`, label: m.nav.faq },
    { href: `#${LANDING_SECTIONS.contact}`, label: m.nav.contact },
  ] as const;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 bg-[color:var(--iris-surface-tile)]/95 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex h-14 w-full min-w-0 max-w-[var(--iris-container)] items-center justify-between gap-4 px-4 sm:h-[56px] sm:px-6 lg:px-8">
        <Link
          to={landingHomePath(locale)}
          className="flex shrink-0 items-center gap-3 no-underline"
        >
          <BrandLogo size="sm" />
          <span className="font-display text-lg font-semibold tracking-tight text-[color:var(--iris-ink-on-dark)]">
            Iris
          </span>
        </Link>

        <nav className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <div className="hidden items-center gap-2 md:flex">
            {navLinks.map((link, index) => (
              <span key={link.href} className="inline-flex items-center gap-2">
                {index > 0 ? (
                  <span aria-hidden className="select-none text-white/20">
                    ·
                  </span>
                ) : null}
                <a href={link.href} className={navLinkClass}>
                  {link.label}
                </a>
              </span>
            ))}
            <span aria-hidden className="select-none text-white/20">
              ·
            </span>
          </div>
          <a
            href={ROUTES.demo.root}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 shrink-0 items-center rounded-[var(--iris-radius-pill)] border border-white/25 px-3.5 text-sm font-medium text-[color:var(--iris-ink-on-dark)] transition-colors hover:border-white/40 hover:bg-white/5"
          >
            {m.nav.demo}
          </a>
          <LandingLanguageSwitcher onDark className="md:ml-0" />
        </nav>
      </div>
    </header>
  );
}
