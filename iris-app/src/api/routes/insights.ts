import { readJsonBody, sendError, sendJson, ValidationError } from "../json.ts";
import { createRouter, route } from "../router.ts";
import { requirePost, routeParam } from "../route-resources.ts";
import { fetchPostInsights } from "../../domain/insights/fetch-post-insights.ts";
import { refreshAllPostInsights } from "../../domain/insights/refresh-all-post-insights.ts";
import { serializePostInsightsSnapshot } from "../../domain/insights/post-insights-response.ts";

export const handleInsightsRoute = createRouter([
  route(
    "POST",
    "/api/insights/refresh-all",
    { admin: true, metaReady: true },
    async (match) => {
      const body = await readJsonBody<Record<string, unknown>>(match.req).catch(() => ({}));
      const limit =
        typeof body.limit === "number"
          ? body.limit
          : typeof body.limit === "string"
            ? Number(body.limit)
            : undefined;
      const delayMs =
        typeof body.delay_ms === "number"
          ? body.delay_ms
          : typeof body.delay_ms === "string"
            ? Number(body.delay_ms)
            : undefined;
      const force = body.force === undefined ? true : Boolean(body.force);

      const result = await refreshAllPostInsights(match.ctx, {
        limit: Number.isFinite(limit) ? limit : undefined,
        delayMs: Number.isFinite(delayMs) ? delayMs : undefined,
        force,
      });

      sendJson(match.res, 200, result);
    },
  ),

  route(
    "GET",
    /^\/api\/posts\/([^/]+)\/insights\/history$/,
    { admin: true },
    async (match) => {
      const postId = routeParam(match, "postId");
      const post = requirePost(match, postId);
      if (!post) {
        return;
      }

      const limitRaw = Number(match.searchParams.get("limit") ?? "30");
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 30;
      const snapshots = match.ctx.postInsightsStore.listByPostId(postId, limit);

      sendJson(match.res, 200, {
        post_id: postId,
        ig_media_id: post.igMediaId,
        snapshots: snapshots.map((snapshot) =>
          serializePostInsightsSnapshot(snapshot, { fromCache: true }),
        ),
      });
    },
    { paramNames: ["postId"] },
  ),

  route(
    "GET",
    /^\/api\/posts\/([^/]+)\/insights$/,
    { admin: true, metaReady: true },
    async (match) => {
      const postId = routeParam(match, "postId");
      const force =
        match.searchParams.get("force") === "1" ||
        match.searchParams.get("refresh") === "1";

      try {
        const result = await fetchPostInsights(match.ctx, postId, { force });
        sendJson(match.res, 200, result);
      } catch (error) {
        if (error instanceof ValidationError && error.message === "post not found") {
          sendError(match.res, 404, error.message);
          return;
        }
        throw error;
      }
    },
    { paramNames: ["postId"] },
  ),
]);
