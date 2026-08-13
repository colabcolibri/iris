import type { ServerAppLocale } from "../../locale.ts";
import { loginEmailEn } from "./en.ts";
import { loginEmailPt } from "./pt.ts";
import type { LoginEmailMessages } from "./types.ts";

export function getLoginEmailMessages(locale: ServerAppLocale): LoginEmailMessages {
  return locale === "en" ? loginEmailEn : loginEmailPt;
}
