export type LoginEmailMessages = {
  subject: string;
  heading: string;
  preheader: (code: string, ttlMinutes: number) => string;
  intro: string;
  expires: (ttlMinutes: number) => string;
  ignore: string;
  textIntro: string;
  textExpires: (ttlMinutes: number) => string;
  textIgnore: string;
};
