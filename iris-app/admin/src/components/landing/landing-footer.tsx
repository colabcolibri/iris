import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/layout/brand-logo";
import { privacyPath } from "@/lib/routes";
import { IRIS_GITHUB_REPO_URL } from "@/lib/landing-external-links";
import { useLandingI18n } from "@/i18n/landing-context";
import { LANDING_SECTIONS, landingHomePath } from "@/i18n/routing";

export function LandingFooter() {
  const { locale, m } = useLandingI18n();
  const year = new Date().getFullYear();
  const host =
    typeof window !== "undefined" ? window.location.host : "";
  const showHost =
    host.length > 0 && !/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);

  return (
    <footer className="bg-(--iris-canvas-parchment) text-(--iris-ink-muted-80)">
      <div className="mx-auto flex w-full min-w-0 max-w-(--iris-container) flex-col gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
        <div className="flex min-w-0 flex-col gap-4">
          <Link
            to={landingHomePath(locale)}
            className="flex items-center gap-3 no-underline"
          >
            <BrandLogo size="sm" />
            <span className="font-display text-lg font-semibold tracking-tight text-(--iris-ink)">
              Iris
            </span>
          </Link>
          <p className="max-w-md text-sm leading-normal text-(--iris-ink-soft)">
            {m.footer.blurb}
          </p>
        </div>

        <div className="flex flex-col gap-3 text-base leading-[2.41]">
          <a
            href={IRIS_GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-(--iris-ink-soft) transition-colors hover:text-(--iris-primary)"
          >
            {m.footer.github}
          </a>
          <a
            href={`#${LANDING_SECTIONS.contact}`}
            className="text-(--iris-ink-soft) transition-colors hover:text-(--iris-primary)"
          >
            {m.footer.contact}
          </a>
          <Link
            to={privacyPath(locale)}
            className="text-(--iris-ink-soft) transition-colors hover:text-(--iris-primary)"
          >
            {m.footer.privacy}
          </Link>
        </div>
      </div>

      <div className="border-t border-(--iris-hairline)">
        <div className="mx-auto flex w-full min-w-0 max-w-(--iris-container) flex-col gap-2 px-4 py-5 text-xs text-(--iris-ink-muted-48) sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {year} Iris · Sergio Luciano</span>
          {showHost ? <span>{host}</span> : null}
        </div>
      </div>
    </footer>
  );
}
