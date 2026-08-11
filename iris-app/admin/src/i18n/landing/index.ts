import type { LandingLocale } from "../types";
import { landingEn } from "./en";
import { landingPt } from "./pt";
import type { LandingMessages } from "./types";

const MESSAGES: Record<LandingLocale, LandingMessages> = {
  pt: landingPt,
  en: landingEn,
};

export function getLandingMessages(locale: LandingLocale): LandingMessages {
  return MESSAGES[locale];
}

export type { LandingMessages } from "./types";
