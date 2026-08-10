import type { IncomingMessage, ServerResponse } from "node:http";
import type { AuthContext } from "../auth.ts";
import { requireAdmin } from "../auth.ts";
import type { AppContext } from "../app-context.ts";
import { sendError, sendJson } from "../json.ts";
import { resolveLatestInspectableMediaId } from "../../domain/meta/resolve-latest-inspectable-media.ts";
import { MetaConversationsUnsupportedError } from "../../adapters/meta/graph-api-conversations-reader.ts";

type RouteRequest = {
  req: IncomingMessage;
  res: ServerResponse;
  ctx: AppContext;
  auth: AuthContext;
};

export async function handleMetaTestRoute(request: RouteRequest): Promise<boolean> {
  const { req, res, ctx, auth } = request;
  const url = new URL(req.url ?? "/", "http://localhost");
  const { pathname } = url;

  if (!pathname.startsWith("/api/meta/test/")) {
    return false;
  }

  if (!requireAdmin(auth)) {
    sendError(res, 403, "admin token required");
    return true;
  }

  if (req.method !== "GET") {
    sendError(res, 405, "method not allowed");
    return true;
  }

  const connection = ctx.metaConnectionStore.get();
  const token = ctx.metaTokenStore.getActiveToken();
  if (!token || !connection?.igUserId) {
    sendJson(res, 200, {
      ok: false,
      code: "not_connected",
      message: "Instagram não conectado.",
    });
    return true;
  }

  if (pathname === "/api/meta/test/insights") {
    const mediaId = url.searchParams.get("media_id")?.trim() || resolveLatestInspectableMediaId(ctx);
    if (!mediaId) {
      sendJson(res, 422, {
        ok: false,
        code: "no_media",
        message: "Nenhuma mídia publicada encontrada. Informe media_id ou publique um post pelo Iris.",
      });
      return true;
    }

    try {
      const insights = await ctx.metaInsightsReader.getMediaInsights(mediaId, [
        "impressions",
        "reach",
        "likes",
        "comments",
        "saved",
      ]);
      sendJson(res, 200, { ok: true, media_id: mediaId, insights });
    } catch (error) {
      sendJson(res, 200, {
        ok: false,
        code: "insights_failed",
        message: error instanceof Error ? error.message : "Falha ao consultar insights.",
        media_id: mediaId,
      });
    }
    return true;
  }

  if (pathname === "/api/meta/test/conversations") {
    const limitRaw = Number(url.searchParams.get("limit") ?? "5");
    const limit = Number.isFinite(limitRaw) ? limitRaw : 5;

    try {
      const conversations = await ctx.metaConversationsReader.listConversations(limit);
      sendJson(res, 200, {
        ok: true,
        count: conversations.length,
        conversations: conversations.map((conversation) => ({
          id: conversation.id,
          updated_time: conversation.updatedTime,
        })),
      });
    } catch (error) {
      if (error instanceof MetaConversationsUnsupportedError) {
        sendJson(res, 200, {
          ok: false,
          code: "unsupported",
          message:
            "Listagem de conversas indisponível com Instagram Login nesta conta. Use o Explorador da Graph API se a Meta exigir.",
        });
        return true;
      }

      sendJson(res, 200, {
        ok: false,
        code: "conversations_failed",
        message: error instanceof Error ? error.message : "Falha ao listar conversas.",
      });
    }
    return true;
  }

  sendError(res, 404, "not found");
  return true;
}
