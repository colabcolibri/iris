export type LandingNavMessages = {
  howItWorks: string;
  features: string;
  trust: string;
  pricing: string;
  faq: string;
  contact: string;
};

export type LandingStepMessages = {
  title: string;
  description: string;
};

export type LandingFeatureMessages = {
  title: string;
  description: string;
  highlight?: boolean;
};

export type LandingTrustItemMessages = {
  title: string;
  description: string;
};

export type LandingPricingItemMessages = {
  title: string;
  description: string;
};

export type LandingFaqItemMessages = {
  question: string;
  answer: string;
};

export type LandingContactFormMessages = {
  name: string;
  email: string;
  subject: string;
  message: string;
  submit: string;
  submitting: string;
  success: string;
  validationError: string;
  genericError: string;
};

export type LandingHeroStageMessages = {
  postHandle: string;
  postCaption: string;
  commentAuthor: string;
  commentBody: string;
  replyAuthor: string;
  replyBody: string;
  replySignature: string;
  statusLabel: string;
};

export type LandingMessages = {
  meta: {
    htmlLang: string;
    documentTitle: string;
  };
  brand: {
    name: string;
  };
  nav: LandingNavMessages;
  hero: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    titleLine2Accent: string;
    subtitle: string;
    cta: string;
    stage: LandingHeroStageMessages;
  };
  workflow: {
    sectionLabel: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    steps: [LandingStepMessages, LandingStepMessages, LandingStepMessages, LandingStepMessages];
  };
  features: {
    sectionLabel: string;
    title: string;
    titleAccent: string;
    subtitle: string;
    items: [
      LandingFeatureMessages,
      LandingFeatureMessages,
      LandingFeatureMessages,
      LandingFeatureMessages,
    ];
  };
  trust: {
    sectionLabel: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    items: [
      LandingTrustItemMessages,
      LandingTrustItemMessages,
      LandingTrustItemMessages,
      LandingTrustItemMessages,
    ];
  };
  pricing: {
    sectionLabel: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    items: [LandingPricingItemMessages, LandingPricingItemMessages, LandingPricingItemMessages];
    note: string;
  };
  faq: {
    sectionLabel: string;
    title: string;
    subtitle: string;
    items: [
      LandingFaqItemMessages,
      LandingFaqItemMessages,
      LandingFaqItemMessages,
      LandingFaqItemMessages,
      LandingFaqItemMessages,
    ];
  };
  contact: {
    sectionLabel: string;
    title: string;
    titleAccent: string;
    bodyBeforeEmail: string;
    bodyAfterEmail: string;
    email: string;
    form: LandingContactFormMessages;
  };
  footer: {
    blurb: string;
    contact: string;
    privacy: string;
  };
};
