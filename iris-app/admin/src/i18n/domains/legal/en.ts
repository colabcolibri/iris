import type { LegalMessages } from "./types";

export const legalEn = {
  privacy: {
    meta: {
      lastUpdated: "August 12, 2026",
    },
    header: {
      signIn: "Sign in",
    },
    page: {
      eyebrow: "Legal",
      title: "Privacy policy",
      lastUpdatedLabel: "Last updated:",
    },
    intro: {
      p1:
        "This policy describes how Iris — a service for scheduling, publishing, and monitoring Instagram content — handles personal data when you use the web interface or connect your Instagram account.",
      p2:
        "Iris runs on a dedicated instance. The data controller is whoever operates that instance (the editorial operator), not Meta.",
    },
    sections: {
      dataCollected: {
        title: "1. Data we collect",
        items: {
          auth: {
            label: "Authentication:",
            body: "email address used for login with a verification code (OTP).",
          },
          instagram: {
            label: "Instagram account:",
            body:
              "identifiers and access tokens provided by Meta after OAuth authorization, plus connected account data (e.g. username and ID).",
          },
          editorial: {
            label: "Editorial content:",
            body: "captions, uploaded images, schedule dates, and post status.",
          },
          comments: {
            label: "Comments:",
            body:
              "text, authors, and metadata synced from your Instagram account via Meta's official API.",
          },
          technical: {
            label: "Technical data:",
            body:
              "basic service usage logs (e.g. access time and errors) for operations and security.",
          },
          analytics: {
            label: "Site analytics:",
            body:
              "pages visited and aggregated events via Umami (privacy-first analytics, no ad cookies or data sales).",
          },
        },
      },
      dataUse: {
        title: "2. How we use data",
        items: [
          "Enable secure login to the admin interface.",
          "Connect and maintain integration with your Instagram account.",
          "Schedule, publish, and manage posts on your behalf.",
          "Display and reply to comments per operator configuration.",
          "Send email notifications related to access (OTP codes).",
          "Ensure security, prevent abuse, and meet legal obligations.",
        ],
      },
      legalBasis: {
        title: "3. Legal basis (LGPD)",
        body:
          "Processing relies, as applicable, on contract performance or preliminary steps, the operator's legitimate interest in editorial management, legal obligation compliance, and, when applicable, consent for optional integrations (such as AI-assisted auto-replies).",
      },
      sharing: {
        title: "4. Sharing with third parties",
        intro: "We may share data only when necessary for the service to work:",
        items: {
          meta: {
            label: "Meta (Instagram):",
            body:
              "to publish content, read comments, and receive webhooks, per permissions you grant.",
          },
          email: {
            label: "Email provider:",
            body: "to send login codes (e.g. Resend in production).",
          },
          ai: {
            label: "AI provider (optional):",
            body:
              "when the operator enables auto-replies, only the context needed to generate the reply.",
          },
        },
        metaPolicyPrefix: "We do not sell personal data. Meta's use follows the",
        metaPolicyLink: "Meta privacy policy",
        metaPolicySuffix: ".",
      },
      retention: {
        title: "5. Retention and deletion",
        body:
          "We keep data while your account is active or as long as needed for the purposes described. Access tokens can be revoked anytime in Iris settings or in the Meta app permissions. Backups and logs follow the retention policy defined by the instance operator.",
      },
      security: {
        title: "6. Security",
        body:
          "We use technical measures such as HttpOnly session cookies, encryption of sensitive tokens at rest, request size limits, and webhook signature validation. No system is 100% secure; in case of an incident, the operator must notify data subjects per LGPD.",
      },
      rights: {
        title: "7. Your rights",
        p1:
          "Under LGPD, you may request confirmation of processing, access, correction, anonymization, portability, deletion of unnecessary data, information on sharing, and consent withdrawal, when applicable.",
        p2:
          "To exercise these rights, contact the operator of the Iris instance you use (usually the email registered as administrator).",
      },
      changes: {
        title: "8. Changes to this policy",
        body:
          "We may update this document to reflect service or legal changes. The date at the top indicates the current version. Continued use after relevant changes may require renewed acceptance, per operator guidance.",
      },
    },
    disclaimer: {
      label: "Notice:",
      body:
        "this text is an informational template for operating Iris and does not replace legal advice. Review with your lawyer before publishing in production, especially if you have data subjects in the European Union (GDPR).",
    },
    footer: {
      copyright: "© {year} Iris. All rights reserved.",
    },
  },
} satisfies LegalMessages;
