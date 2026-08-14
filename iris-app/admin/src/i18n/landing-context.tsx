import { useEffect, type ReactNode } from "react";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";
import type { AppLocale } from "@/i18n/types";

type LandingI18nProviderProps = {
  locale: AppLocale;
  children: ReactNode;
};

/** Syncs route locale into AppI18nProvider and sets landing document meta. */
export function LandingI18nProvider({
  locale,
  children,
}: LandingI18nProviderProps) {
  const { setLocale } = useAppLocale();
  const m = useDomainMessages("marketing");

  useEffect(() => {
    setLocale(locale);
  }, [locale, setLocale]);

  useEffect(() => {
    document.documentElement.lang = m.meta.htmlLang;
    document.title = m.meta.documentTitle;
  }, [m.meta.htmlLang, m.meta.documentTitle]);

  return children;
}

export function useLandingI18n() {
  const { locale } = useAppLocale();
  const m = useDomainMessages("marketing");
  return { locale, m };
}
