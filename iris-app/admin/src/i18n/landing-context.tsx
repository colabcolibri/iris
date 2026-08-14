import { useEffect, type ReactNode } from "react";
import { useAppLocale, useDomainMessages } from "@/i18n/provider";

type LandingI18nProviderProps = {
  children: ReactNode;
};

/** Sets landing document meta from the active marketing domain. */
export function LandingI18nProvider({ children }: LandingI18nProviderProps) {
  const m = useDomainMessages("marketing");

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
