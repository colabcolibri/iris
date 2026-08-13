export const ADMIN_BASE = "/admin";

export const adminPath = (segment = "") =>
  segment ? `${ADMIN_BASE}/${segment.replace(/^\//, "")}` : ADMIN_BASE;

export const ROUTES = {
  home: "/",
  privacy: "/privacy",
  demo: {
    root: "/demo",
    comments: "/demo/comments",
    messages: "/demo/messages",
    products: "/demo/products",
    stores: "/demo/stores",
    webhooks: "/demo/webhooks",
    agentRuns: "/demo/agent-runs",
    agentSimulator: "/demo/agent-simulator",
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
    settings: adminPath("settings"),
    persona: adminPath("persona"),
  },
} as const;
