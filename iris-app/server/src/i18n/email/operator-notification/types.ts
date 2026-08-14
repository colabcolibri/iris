export type OperatorNotificationEmailMessages = {
  subject: (urgency: string) => string;
  heading: string;
  intro: string;
  urgencyLabel: string;
  reasonLabel: string;
  summaryLabel: string;
  supportIntentLabel: string;
  participantLabel: string;
  suggestedNextStepLabel: string;
  openInIrisLabel: string;
  unknownTime: string;
  defaultParticipant: string;
};
