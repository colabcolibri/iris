import { useAppLocale, useDomainMessages } from "@/i18n/provider";

/** Demo locale reads from the root AppI18nProvider. */
export function useDemoLocale() {
  const { locale, setLocale } = useAppLocale();
  const m = useDomainMessages("demoContent").ui;
  return { locale, setLocale, m };
}
