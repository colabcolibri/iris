import type { AppLocale } from "@/i18n/types";

export const ADMIN_BASE = "/admin";

export const adminPath = (segment = "") =>
  segment ? `${ADMIN_BASE}/${segment.replace(/^\//, "")}` : ADMIN_BASE;

export function privacyPath(locale: AppLocale = "pt"): string {
  return locale === "en" ? "/en/privacy" : "/privacy";
}

export const ROUTES = {
  home: "/",
  privacy: "/privacy",
  privacyEn: "/en/privacy",
  demo: {
    root: "/demo",
    comments: "/demo/comments",
    messages: "/demo/messages",
    products: "/demo/products",
    stores: "/demo/stores",
    webhooks: "/demo/webhooks",
    agentRuns: "/demo/agent-runs",
    agentSimulator: "/demo/agent-simulator",
    messageSimulator: "/demo/message-simulator",
    settings: "/demo/settings",
    persona: "/demo/persona",
  },
  admin: {
    root: ADMIN_BASE,
    login: adminPath("login"),
    comments: adminPath("comments"),
    messages: adminPath("messages"),
    products: adminPath("products"),
    stores: adminPath("stores"),
    webhooks: adminPath("webhooks"),
    agentRuns: adminPath("agent-runs"),
    agentSimulator: adminPath("agent-simulator"),
    messageSimulator: adminPath("message-simulator"),
    settings: adminPath("settings"),
    persona: adminPath("persona"),
  },
} as const;
