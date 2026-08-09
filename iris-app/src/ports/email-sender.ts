export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
};

export type SendEmailResult = {
  ok: boolean;
  error?: string;
};

export type EmailSender = {
  send(input: SendEmailInput): Promise<SendEmailResult>;
};
