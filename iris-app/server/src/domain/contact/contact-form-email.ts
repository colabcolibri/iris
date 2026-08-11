import {
  emailMetaList,
  emailParagraphs,
  emailQuote,
  renderIrisEmailHtml,
} from "../email/email-html.ts";

export function buildContactFormEmailContent(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  pageUrl?: string;
}): { subject: string; text: string; html: string } {
  const lines = [
    "Nova mensagem pelo formulário de contato do Iris:",
    "",
    `Nome: ${input.name}`,
    `Email: ${input.email}`,
    `Assunto: ${input.subject}`,
  ];

  if (input.pageUrl) {
    lines.push(`Página: ${input.pageUrl}`);
  }

  lines.push("", "Mensagem:", "", input.message);

  const meta = [
    { label: "Nome", value: input.name },
    { label: "Email", value: input.email },
    { label: "Assunto", value: input.subject },
  ];
  if (input.pageUrl) {
    meta.push({ label: "Página", value: input.pageUrl });
  }

  const html = renderIrisEmailHtml({
    heading: "Nova mensagem de contato",
    preheader: `${input.name}: ${input.subject}`,
    bodyHtml: [
      emailParagraphs("Alguém enviou uma mensagem pelo formulário do site Iris."),
      emailMetaList(meta),
      emailParagraphs("Mensagem:"),
      emailQuote(input.message),
    ].join(""),
    footerNote: "Responda este email para falar diretamente com o remetente.",
  });

  return {
    subject: `[Iris] ${input.subject}`,
    text: lines.join("\n"),
    html,
  };
}
