import type { ContactEmailMessages } from "./types.ts";

export const contactEmailEn = {
  subjectPrefix: "[Iris]",
  heading: "New contact message",
  intro: "Someone sent a message through the Iris website contact form.",
  messageLabel: "Message:",
  footerNote: "Reply to this email to reach the sender directly.",
  textIntro: "New message from the Iris contact form:",
  textMessageLabel: "Message:",
  labels: {
    name: "Name",
    email: "Email",
    subject: "Subject",
    page: "Page",
  },
  successMessage: "Thank you — we received your message and will reply by email.",
} satisfies ContactEmailMessages;
