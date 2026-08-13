import type { LoginEmailMessages } from "./types.ts";

export const loginEmailEn = {
  subject: "Your sign-in code — Iris",
  heading: "Your sign-in code",
  preheader: (code, ttlMinutes) =>
    `Iris code: ${code} — expires in ${ttlMinutes} minutes`,
  intro: "Use the code below to sign in to Iris:",
  expires: (ttlMinutes) => `The code expires in ${ttlMinutes} minutes.`,
  ignore: "If you did not request this email, you can ignore it.",
  textIntro: "Use the code below to sign in to Iris:",
  textExpires: (ttlMinutes) => `The code expires in ${ttlMinutes} minutes.`,
  textIgnore: "If you did not request this email, you can ignore it.",
} satisfies LoginEmailMessages;
