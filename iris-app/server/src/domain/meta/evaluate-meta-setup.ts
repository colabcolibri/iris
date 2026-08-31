import type { DatabaseSync } from "node:sqlite";
import type { AppContext } from "../../api/app-context.ts";
import {
  checkMetaConnection,
  checkMetaMessagingAccess,
} from "../../adapters/meta/meta-health-check.ts";
import { getMetaReadiness } from "./meta-readiness.ts";

export type MetaSetupStepStatus = "ok" | "warning" | "error" | "pending";

export type MetaSetupStep = {
  id: string;
  status: MetaSetupStepStatus;
  message?: string;
};

export type MetaSetupSnapshot = {
  oauth_configured: boolean;
  public_base_url: string | null;
  webhook_url: string | null;
  webhook_verify_token_configured: boolean;
  redirect_uri: string | null;
  page_redirect_uri: string | null;
  instagram_connected: boolean;
  ig_username: string | null;
  page_connected: boolean;
  page_name: string | null;
  page_token_source: "db" | "env" | null;
  messaging_supported: boolean;
  recent_webhook_activity: boolean;
  handover_help_url: string;
  steps: MetaSetupStep[];
};

type EvaluateMetaSetupInput = {
  ctx: AppContext;
  webhookVerifyTokenConfigured: boolean;
  recentWebhookActivity: boolean;
};

export async function evaluateMetaSetup(
  input: EvaluateMetaSetupInput,
): Promise<MetaSetupSnapshot> {
  const { ctx, webhookVerifyTokenConfigured, recentWebhookActivity } = input;
  const connection = ctx.metaConnectionStore.get();
  const readiness = getMetaReadiness(ctx);
  const instagramConnected = readiness.ready;
  const token = ctx.metaTokenStore.getActiveToken();

  const envPageId = process.env.META_PAGE_ID?.trim() || null;
  const envPageToken = process.env.META_PAGE_ACCESS_TOKEN?.trim() || null;
  const dbPageToken = ctx.metaConnectionStore.getPageAccessToken();
  const pageTokenSource: MetaSetupSnapshot["page_token_source"] = dbPageToken
    ? "db"
    : envPageToken
      ? "env"
      : null;

  const pageConnected =
    (Boolean(pageTokenSource) &&
      Boolean(connection?.pageId && connection.pageId !== "instagram-login")) ||
    Boolean(envPageId && envPageToken);

  let messagingSupported = false;
  if (instagramConnected && token && connection?.igUserId) {
    const messagingHealth = await checkMetaMessagingAccess({
      igUserId: connection.igUserId,
      token,
      graphApiVersion: ctx.graphApiVersion,
    });
    messagingSupported = messagingHealth.ok;
  }

  const publicBase = ctx.publicBaseUrl?.replace(/\/$/, "") || null;
  const oauthConfigured = Boolean(
    process.env.META_INSTAGRAM_APP_ID?.trim() ||
      process.env.META_APP_ID?.trim(),
  );

  const steps: MetaSetupStep[] = [
    {
      id: "meta_app",
      status: oauthConfigured ? "ok" : "error",
      message: oauthConfigured
        ? "App Meta configurado no servidor."
        : "Defina META_INSTAGRAM_APP_ID e META_INSTAGRAM_APP_SECRET (ou META_APP_ID/SECRET).",
    },
    {
      id: "public_url",
      status: publicBase ? "ok" : "error",
      message: publicBase
        ? "URL pública configurada."
        : "Defina IRIS_PUBLIC_BASE_URL com HTTPS.",
    },
    {
      id: "webhook",
      status: webhookVerifyTokenConfigured
        ? recentWebhookActivity
          ? "ok"
          : "warning"
        : "error",
      message: webhookVerifyTokenConfigured
        ? recentWebhookActivity
          ? "Webhook verificado e eventos recentes recebidos."
          : "Token de webhook configurado — cadastre a URL no painel Meta se ainda não fez."
        : "Defina META_WEBHOOK_VERIFY_TOKEN no servidor.",
    },
    {
      id: "instagram",
      status: instagramConnected ? "ok" : "pending",
      message: instagramConnected
        ? `Instagram conectado (@${connection?.igUsername ?? "usuario"}).`
        : "Conecte a conta Instagram no passo abaixo.",
    },
    {
      id: "comments",
      status: instagramConnected && recentWebhookActivity ? "ok" : instagramConnected ? "warning" : "pending",
      message: instagramConnected
        ? recentWebhookActivity
          ? "Comentários chegando via webhook."
          : "Conectado — confirme webhook com campo comments no painel Meta."
        : "Conecte o Instagram primeiro.",
    },
    {
      id: "messaging",
      status: messagingSupported
        ? pageConnected
          ? "ok"
          : "warning"
        : instagramConnected
          ? "warning"
          : "pending",
      message: messagingSupported
        ? pageConnected
          ? "DMs habilitadas com token de Página."
          : "Permissão de mensagens OK — conecte a Página Facebook para recuperar threads."
        : instagramConnected
          ? "Reconecte com modo completo ou verifique App Review."
          : "Ative após conectar o Instagram.",
    },
  ];

  if (token && connection?.igUserId) {
    const connectionHealth = await checkMetaConnection({
      igUserId: connection.igUserId,
      token,
      graphApiVersion: ctx.graphApiVersion,
    });
    if (!connectionHealth.ok && instagramConnected) {
      steps[3] = {
        id: "instagram",
        status: "error",
        message: connectionHealth.message ?? "Falha ao validar token Instagram.",
      };
    }
  }

  return {
    oauth_configured: oauthConfigured,
    public_base_url: publicBase,
    webhook_url: publicBase ? `${publicBase}/webhooks/meta` : null,
    webhook_verify_token_configured: webhookVerifyTokenConfigured,
    redirect_uri: publicBase ? `${publicBase}/auth/meta/callback` : null,
    page_redirect_uri: publicBase ? `${publicBase}/auth/meta/page/callback` : null,
    instagram_connected: instagramConnected,
    ig_username: connection?.igUsername ?? null,
    page_connected: pageConnected,
    page_name:
      connection?.pageId !== "instagram-login" ? connection?.pageName : null,
    page_token_source: pageTokenSource,
    messaging_supported: messagingSupported,
    recent_webhook_activity: recentWebhookActivity,
    handover_help_url: "https://www.facebook.com/settings/?tab=advanced_messaging",
    steps,
  };
}

export function hasRecentWebhookActivity(db: DatabaseSync, withinHours = 72): boolean {
  const row = db
    .prepare(
      `SELECT received_at FROM meta_webhook_events
       ORDER BY datetime(received_at) DESC LIMIT 1`,
    )
    .get() as { received_at: string } | undefined;

  if (!row?.received_at) {
    return false;
  }

  const receivedMs = Date.parse(row.received_at);
  if (!Number.isFinite(receivedMs)) {
    return false;
  }

  return Date.now() - receivedMs <= withinHours * 60 * 60 * 1000;
}
