import type { OperatorNotificationEmailMessages } from "./types.ts";

export const operatorNotificationEmailEn = {
  subject: (urgency) => `[Iris DM] Message awaiting your reply — ${urgency}`,
  heading: "Message awaiting your reply",
  intro:
    "A customer message needs your attention. Iris paused automatic replies in this thread until you unlock it or the lock expires.",
  urgencyLabel: "Urgency",
  reasonLabel: "Reason",
  summaryLabel: "Summary",
  supportIntentLabel: "Support intent",
  participantLabel: "Participant",
  suggestedNextStepLabel: "Suggested next step",
  openInIrisLabel: "Open in Iris",
  unknownTime: "Unknown time",
  defaultParticipant: "Customer",
} satisfies OperatorNotificationEmailMessages;
