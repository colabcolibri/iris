import { useLocation } from "react-router-dom";
import { useAppLocale } from "@/i18n/provider";
import { parseRouteLocaleFromPath } from "@/i18n/routing";

/**
 * Keeps AppI18n locale aligned with marketing/legal routes during SPA navigation.
 * Initial F5 is handled in AppI18nProvider state initializer (same parser).
 */
export function RouteLocaleSync() {
  const { pathname } = useLocation();
  const { locale, setLocale } = useAppLocale();
  const routeLocale = parseRouteLocaleFromPath(pathname);

  if (routeLocale !== null && routeLocale !== locale) {
    setLocale(routeLocale);
  }

  return null;
}
