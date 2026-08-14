import { Fragment } from "react";
import { APP_LOCALES } from "@/i18n/types";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import { updateAppSettings } from "@/lib/api";
import { getDemoMode } from "@/demo/demo-mode-context";
import { cn } from "@/lib/utils";

const LOCALE_SHORT = {
  pt: "PT",
  en: "EN",
} as const;

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useAppLocale();
  const shell = useDomainMessages("shell");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold tracking-[0.08em] uppercase",
        className,
      )}
      role="group"
      aria-label={shell.languageSwitcher.label}
    >
      {APP_LOCALES.map((item, index) => (
        <Fragment key={item}>
          {index > 0 ? (
            <span
              aria-hidden
              className="select-none font-normal text-sidebar-foreground/30"
            >
              ·
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setLocale(item);
              if (!getDemoMode()) {
                void updateAppSettings({ admin_locale: item }).catch(() => {});
              }
            }}
            className={cn(
              "rounded px-1.5 py-0.5 transition-colors",
              item === locale
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
            )}
            aria-current={item === locale ? "true" : undefined}
            lang={item === "pt" ? "pt-BR" : "en"}
          >
            {LOCALE_SHORT[item]}
          </button>
        </Fragment>
      ))}
    </span>
  );
}
