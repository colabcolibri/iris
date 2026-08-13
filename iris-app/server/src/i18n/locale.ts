export type ServerAppLocale = "pt" | "en";

export type EmailHtmlLang = "pt-BR" | "en-US";

export function parseServerLocale(value: string | null | undefined): ServerAppLocale {
  return value === "en" ? "en" : "pt";
}

export function localeToEmailLang(locale: ServerAppLocale): EmailHtmlLang {
  return locale === "en" ? "en-US" : "pt-BR";
}
