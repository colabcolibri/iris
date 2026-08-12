import { Fragment } from "react";
import { DEMO_LOCALES, type DemoLocale } from "@/demo/locale";
import { useDemoLocale } from "@/demo/demo-locale-context";
import { cn } from "@/lib/utils";

const LOCALE_LABEL: Record<DemoLocale, string> = {
  pt: "PT",
  en: "EN",
};

export function DemoLanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, m } = useDemoLocale();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold tracking-[0.08em] uppercase",
        className,
      )}
      role="group"
      aria-label={m.languageLabel}
    >
      {DEMO_LOCALES.map((item, index) => (
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
            onClick={() => setLocale(item)}
            className={cn(
              "rounded px-1.5 py-0.5 transition-colors",
              item === locale
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
            )}
            aria-current={item === locale ? "true" : undefined}
            lang={item === "pt" ? "pt-BR" : "en"}
          >
            {LOCALE_LABEL[item]}
          </button>
        </Fragment>
      ))}
    </span>
  );
}
