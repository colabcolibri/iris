import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getAllDomainMessages,
  type DomainMessagesMap,
  type I18nDomainId,
} from "@/i18n/compose";
import { readStoredAppLocale, writeStoredAppLocale } from "@/i18n/storage";
import {
  DEFAULT_APP_LOCALE,
  localeToBcp47,
  type AppLocale,
  type Bcp47Locale,
} from "@/i18n/types";

type AppI18nContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  bcp47: Bcp47Locale;
  domains: DomainMessagesMap;
  onLocaleChange?: (locale: AppLocale) => void;
};

const AppI18nContext = createContext<AppI18nContextValue | null>(null);

type AppI18nProviderProps = {
  children: ReactNode;
  /** Override locale (landing routes). */
  initialLocale?: AppLocale;
  /** Skip localStorage read (SSR/tests). */
  disablePersistence?: boolean;
  /** Called after locale changes (demo reset). */
  onLocaleChange?: (locale: AppLocale) => void;
  /** Override document title (landing provides per-page). */
  documentTitle?: string;
};

export function AppI18nProvider({
  children,
  initialLocale,
  disablePersistence = false,
  onLocaleChange,
  documentTitle,
}: AppI18nProviderProps) {
  const [locale, setLocaleState] = useState<AppLocale>(() => {
    if (initialLocale) return initialLocale;
    if (disablePersistence) return DEFAULT_APP_LOCALE;
    return readStoredAppLocale();
  });

  const setLocale = useCallback(
    (next: AppLocale) => {
      setLocaleState((current) => {
        if (current === next) return current;
        if (!disablePersistence && !initialLocale) {
          writeStoredAppLocale(next);
        }
        onLocaleChange?.(next);
        return next;
      });
    },
    [disablePersistence, initialLocale, onLocaleChange],
  );

  const bcp47 = localeToBcp47(locale);
  const domains = useMemo(() => getAllDomainMessages(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = bcp47;
    if (documentTitle) {
      document.title = documentTitle;
    }
  }, [bcp47, documentTitle]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      bcp47,
      domains,
      onLocaleChange,
    }),
    [locale, setLocale, bcp47, domains, onLocaleChange],
  );

  return (
    <AppI18nContext.Provider value={value}>{children}</AppI18nContext.Provider>
  );
}

export function useAppI18n(): AppI18nContextValue {
  const ctx = useContext(AppI18nContext);
  if (!ctx) {
    throw new Error("useAppI18n must be used within AppI18nProvider");
  }
  return ctx;
}

export function useAppLocale() {
  const { locale, setLocale, bcp47 } = useAppI18n();
  return { locale, setLocale, bcp47 };
}

export function useDomainMessages<D extends I18nDomainId>(
  domain: D,
): DomainMessagesMap[D] {
  const { domains } = useAppI18n();
  return domains[domain];
}

/** Safe hook for components that may render outside provider during migration. */
export function useOptionalAppLocale(): {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  bcp47: Bcp47Locale;
} {
  const ctx = useContext(AppI18nContext);
  if (!ctx) {
    return {
      locale: DEFAULT_APP_LOCALE,
      setLocale: () => {},
      bcp47: localeToBcp47(DEFAULT_APP_LOCALE),
    };
  }
  return {
    locale: ctx.locale,
    setLocale: ctx.setLocale,
    bcp47: ctx.bcp47,
  };
}
