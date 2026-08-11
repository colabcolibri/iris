import { createContext, useContext, useEffect, type ReactNode } from "react";
import { getLandingMessages, type LandingMessages } from "./landing";
import type { LandingLocale } from "./types";

type LandingI18nContextValue = {
  locale: LandingLocale;
  m: LandingMessages;
};

const LandingI18nContext = createContext<LandingI18nContextValue | null>(null);

type LandingI18nProviderProps = {
  locale: LandingLocale;
  children: ReactNode;
};

export function LandingI18nProvider({ locale, children }: LandingI18nProviderProps) {
  const m = getLandingMessages(locale);

  useEffect(() => {
    document.documentElement.lang = m.meta.htmlLang;
    document.title = m.meta.documentTitle;
  }, [m.meta.htmlLang, m.meta.documentTitle]);

  return (
    <LandingI18nContext.Provider value={{ locale, m }}>
      {children}
    </LandingI18nContext.Provider>
  );
}

export function useLandingI18n(): LandingI18nContextValue {
  const value = useContext(LandingI18nContext);
  if (!value) {
    throw new Error("useLandingI18n must be used within LandingI18nProvider");
  }
  return value;
}
