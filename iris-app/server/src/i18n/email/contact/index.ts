import type { ServerAppLocale } from "../../locale.ts";
import { contactEmailEn } from "./en.ts";
import { contactEmailPt } from "./pt.ts";
import type { ContactEmailMessages } from "./types.ts";

export function getContactEmailMessages(locale: ServerAppLocale): ContactEmailMessages {
  return locale === "en" ? contactEmailEn : contactEmailPt;
}
