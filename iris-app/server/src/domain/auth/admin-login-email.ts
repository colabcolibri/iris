import {
  emailCodeBlock,
  emailMuted,
  emailParagraphs,
  renderIrisEmailHtml,
} from "../email/email-html.ts";

export function buildAdminLoginEmailContent(input: {
  code: string;
  ttlMinutes: number;
}): { subject: string; text: string; html: string } {
  const subject = "Seu código de acesso — Iris";
  const text = [
    "Use o código abaixo para entrar no Iris:",
    "",
    input.code,
    "",
    `O código expira em ${input.ttlMinutes} minutos.`,
    "Se você não solicitou este email, ignore.",
  ].join("\n");

  const html = renderIrisEmailHtml({
    heading: "Seu código de acesso",
    preheader: `Código Iris: ${input.code} — expira em ${input.ttlMinutes} minutos`,
    bodyHtml: [
      emailParagraphs("Use o código abaixo para entrar no Iris:"),
      emailCodeBlock(input.code),
      emailMuted(`O código expira em ${input.ttlMinutes} minutos.`),
      emailMuted("Se você não solicitou este email, ignore."),
    ].join(""),
  });

  return { subject, text, html };
}
