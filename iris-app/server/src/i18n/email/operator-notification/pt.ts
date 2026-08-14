import type { OperatorNotificationEmailMessages } from "./types.ts";

export const operatorNotificationEmailPt = {
  subject: (urgency) => `[Iris DM] Mensagem aguardando sua resposta — ${urgency}`,
  heading: "Mensagem aguardando sua resposta",
  intro:
    "Uma mensagem do cliente precisa da sua atenção. O Iris pausou respostas automáticas nesta conversa até você destravar ou o prazo expirar.",
  urgencyLabel: "Urgência",
  reasonLabel: "Motivo",
  summaryLabel: "Resumo",
  supportIntentLabel: "Intenção",
  participantLabel: "Participante",
  suggestedNextStepLabel: "Próximo passo sugerido",
  openInIrisLabel: "Abrir no Iris",
  unknownTime: "Horário desconhecido",
  defaultParticipant: "Cliente",
} satisfies OperatorNotificationEmailMessages;
