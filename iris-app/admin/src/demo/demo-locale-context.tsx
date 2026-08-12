import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_DEMO_LOCALE,
  readStoredDemoLocale,
  writeStoredDemoLocale,
  type DemoLocale,
} from "@/demo/locale";
import { resetDemoState, setActiveDemoLocale } from "@/demo/demo-state";
import { getDemoUiMessages } from "@/demo/fixtures/i18n/ui";

type DemoLocaleContextValue = {
  locale: DemoLocale;
  setLocale: (locale: DemoLocale) => void;
  m: ReturnType<typeof getDemoUiMessages>;
};

const DemoLocaleContext = createContext<DemoLocaleContextValue | null>(null);

export function DemoLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<DemoLocale>(() => {
    const initial = readStoredDemoLocale();
    setActiveDemoLocale(initial);
    return initial;
  });

  const setLocale = useCallback((next: DemoLocale) => {
    setLocaleState((current) => {
      if (current === next) return current;
      writeStoredDemoLocale(next);
      setActiveDemoLocale(next);
      resetDemoState();
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      m: getDemoUiMessages(locale),
    }),
    [locale, setLocale],
  );

  return (
    <DemoLocaleContext.Provider value={value}>
      {children}
    </DemoLocaleContext.Provider>
  );
}

export function useDemoLocale() {
  const ctx = useContext(DemoLocaleContext);
  if (!ctx) {
    return {
      locale: DEFAULT_DEMO_LOCALE as DemoLocale,
      setLocale: () => {},
      m: getDemoUiMessages(DEFAULT_DEMO_LOCALE),
    };
  }
  return ctx;
}
