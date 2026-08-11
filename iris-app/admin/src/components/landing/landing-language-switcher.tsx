import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";
import { LANDING_LOCALES, type LandingLocale } from "@/i18n/types";
import { landingHomePath } from "@/i18n/routing";
import { useLandingI18n } from "@/i18n/landing-context";
import { cn } from "@/lib/utils";

const LOCALE_LABEL: Record<LandingLocale, string> = {
  pt: "PT",
  en: "EN",
};

type LandingLanguageSwitcherProps = {
  className?: string;
  onDark?: boolean;
};

export function LandingLanguageSwitcher({ className, onDark = false }: LandingLanguageSwitcherProps) {
  const { locale } = useLandingI18n();
  const location = useLocation();
  const suffix = `${location.hash}${location.search}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[13px] font-semibold tracking-[0.08em] uppercase",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {LANDING_LOCALES.map((item, index) => (
        <Fragment key={item}>
          {index > 0 ? (
            <span
              aria-hidden
              className={cn(
                "select-none font-normal",
                onDark ? "text-white/25" : "text-[color:var(--iris-hairline)]",
              )}
            >
              ·
            </span>
          ) : null}
          <Link
            to={`${landingHomePath(item)}${suffix}`}
            className={cn(
              "rounded px-1.5 py-0.5 transition-colors",
              item === locale
                ? onDark
                  ? "bg-white/12 text-[color:var(--iris-primary-on-dark)]"
                  : "bg-[color:var(--iris-primary)]/12 text-[color:var(--iris-primary)]"
                : onDark
                  ? "text-[color:var(--iris-ink-muted-on-dark)] hover:text-[color:var(--iris-ink-on-dark)]"
                  : "text-[color:var(--iris-ink-muted)] hover:text-[color:var(--iris-ink)]",
            )}
            aria-current={item === locale ? "page" : undefined}
            hrefLang={item === "pt" ? "pt-BR" : "en"}
          >
            {LOCALE_LABEL[item]}
          </Link>
        </Fragment>
      ))}
    </span>
  );
}
