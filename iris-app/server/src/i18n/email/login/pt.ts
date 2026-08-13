import type { LoginEmailMessages } from "./types.ts";

export const loginEmailPt = {
  subject: "Seu código de acesso — Iris",
  heading: "Seu código de acesso",
  preheader: (code, ttlMinutes) =>
    `Código Iris: ${code} — expira em ${ttlMinutes} minutos`,
  intro: "Use o código abaixo para entrar no Iris:",
  expires: (ttlMinutes) => `O código expira em ${ttlMinutes} minutos.`,
  ignore: "Se você não solicitou este email, ignore.",
  textIntro: "Use o código abaixo para entrar no Iris:",
  textExpires: (ttlMinutes) => `O código expira em ${ttlMinutes} minutos.`,
  textIgnore: "Se você não solicitou este email, ignore.",
} satisfies LoginEmailMessages;
