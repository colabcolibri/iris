export function buildContactFormEmailContent(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  pageUrl?: string;
}): { subject: string; text: string } {
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

  return {
    subject: `[Iris] ${input.subject}`,
    text: lines.join("\n"),
  };
}
