import type { ContactEmailMessages } from "./types.ts";

export const contactEmailPt = {
  subjectPrefix: "[Iris]",
  heading: "Nova mensagem de contato",
  intro: "Alguém enviou uma mensagem pelo formulário do site Iris.",
  messageLabel: "Mensagem:",
  footerNote: "Responda este email para falar diretamente com o remetente.",
  textIntro: "Nova mensagem pelo formulário de contato do Iris:",
  textMessageLabel: "Mensagem:",
  labels: {
    name: "Nome",
    email: "Email",
    subject: "Assunto",
    page: "Página",
  },
  successMessage: "Obrigado — recebemos sua mensagem e responderemos por email.",
} satisfies ContactEmailMessages;
