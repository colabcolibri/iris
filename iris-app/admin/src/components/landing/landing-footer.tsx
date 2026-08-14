import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/layout/brand-logo";
import { privacyPath } from "@/lib/routes";
import { useLandingI18n } from "@/i18n/landing-context";
import { LANDING_SECTIONS, landingHomePath } from "@/i18n/routing";

export function LandingFooter() {
  const { locale, m } = useLandingI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[color:var(--iris-canvas-parchment)] text-[color:var(--iris-ink-muted-80)]">
      <div className="mx-auto flex w-full min-w-0 max-w-[var(--iris-container)] flex-col gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
        <div className="flex min-w-0 flex-col gap-4">
          <Link
            to={landingHomePath(locale)}
            className="flex items-center gap-3 no-underline"
          >
            <BrandLogo size="sm" />
            <span className="font-display text-lg font-semibold tracking-tight text-[color:var(--iris-ink)]">
              Iris
            </span>
          </Link>
          <p className="max-w-md text-sm leading-normal text-[color:var(--iris-ink-soft)]">
            {m.footer.blurb}
          </p>
        </div>

        <div className="flex flex-col gap-3 text-base leading-[2.41]">
          <a
            href={`#${LANDING_SECTIONS.contact}`}
            className="text-[color:var(--iris-ink-soft)] transition-colors hover:text-[color:var(--iris-primary)]"
          >
            {m.footer.contact}
          </a>
          <Link
            to={privacyPath(locale)}
            className="text-[color:var(--iris-ink-soft)] transition-colors hover:text-[color:var(--iris-primary)]"
          >
            {m.footer.privacy}
          </Link>
        </div>
      </div>

      <div className="border-t border-[color:var(--iris-hairline)]">
        <div className="mx-auto flex w-full min-w-0 max-w-[var(--iris-container)] flex-col gap-2 px-4 py-5 text-xs text-[color:var(--iris-ink-muted-48)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {year} Iris · Sergio Luciano</span>
          <span>iris.sergioluciano.com</span>
        </div>
      </div>
    </footer>
  );
}
