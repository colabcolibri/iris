export function buildAdminLoginEmailContent(input: {
  code: string;
  ttlMinutes: number;
}): { subject: string; text: string } {
  return {
    subject: "Seu código de acesso — Iris",
    text: [
      "Use o código abaixo para entrar no Iris:",
      "",
      input.code,
      "",
      `O código expira em ${input.ttlMinutes} minutos.`,
      "Se você não solicitou este email, ignore.",
    ].join("\n"),
  };
}
