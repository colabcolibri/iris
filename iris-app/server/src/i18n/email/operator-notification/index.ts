import type { ServerAppLocale } from "../../locale.ts";
import { operatorNotificationEmailEn } from "./en.ts";
import { operatorNotificationEmailPt } from "./pt.ts";
import type { OperatorNotificationEmailMessages } from "./types.ts";

export function getOperatorNotificationEmailMessages(
  locale: ServerAppLocale,
): OperatorNotificationEmailMessages {
  return locale === "en" ? operatorNotificationEmailEn : operatorNotificationEmailPt;
}
