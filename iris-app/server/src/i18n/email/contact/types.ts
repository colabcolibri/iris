export type ContactEmailMessages = {
  subjectPrefix: string;
  heading: string;
  intro: string;
  messageLabel: string;
  footerNote: string;
  textIntro: string;
  textMessageLabel: string;
  labels: {
    name: string;
    email: string;
    subject: string;
    page: string;
  };
  successMessage: string;
};
