import { readJsonBody, sendError, sendJson, ValidationError } from "../json.ts";
import { createRouter, route } from "../router.ts";
import { requirePost, routeParam } from "../route-resources.ts";
import { fetchAccountInsights } from "../../domain/insights/fetch-account-insights.ts";
import { fetchPostInsights } from "../../domain/insights/fetch-post-insights.ts";
import { refreshAllPostInsights } from "../../domain/insights/refresh-all-post-insights.ts";
import { refreshMediaInsightsPage } from "../../domain/insights/refresh-media-insights-page.ts";
import { serializePostInsightsSnapshot } from "../../domain/insights/post-insights-response.ts";

function optionalIso(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : undefined;
}

export const handleInsightsRoute = createRouter([
  route(
    "GET",
    "/api/insights/account",
    { admin: true, metaReady: true },
    async (match) => {
      const period = match.searchParams.get("period") ?? undefined;
      const since = match.searchParams.get("since");
      const until = match.searchParams.get("until");
      const metricsRaw = match.searchParams.get("metrics");
      const metrics = metricsRaw
        ? metricsRaw
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined;

      try {
        const result = await fetchAccountInsights(match.ctx, {
          period,
          since,
          until,
          metrics,
        });
        sendJson(match.res, 200, result);
      } catch (error) {
        if (error instanceof ValidationError) {
          sendError(match.res, 422, error.message);
          return;
        }
        throw error;
      }
    },
  ),

  route(
    "POST",
    "/api/insights/refresh-media-page",
    { admin: true, metaReady: true },
    async (match) => {
      const body = await readJsonBody<Record<string, unknown>>(match.req).catch(
        () => ({}),
      );
      const limit =
        typeof body.limit === "number"
          ? body.limit
          : typeof body.limit === "string"
            ? Number(body.limit)
            : undefined;
      const after =
        typeof body.after === "string" && body.after.trim()
          ? body.after.trim()
          : null;
      const since = optionalIso(body.since);
      const until = optionalIso(body.until);
      const force = body.force === undefined ? true : Boolean(body.force);

      try {
        const result = await refreshMediaInsightsPage(match.ctx, {
          limit: Number.isFinite(limit) ? limit : undefined,
          after,
          since,
          until,
          force,
        });
        sendJson(match.res, 200, result);
      } catch (error) {
        if (error instanceof ValidationError) {
          sendError(match.res, 422, error.message);
          return;
        }
        throw error;
      }
    },
  ),

  route(
    "POST",
    "/api/insights/refresh-all",
    { admin: true, metaReady: true },
    async (match) => {
      const body = await readJsonBody<Record<string, unknown>>(match.req).catch(
        () => ({}),
      );
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
      const since = optionalIso(body.since);
      const until = optionalIso(body.until);

      const result = await refreshAllPostInsights(match.ctx, {
        limit: Number.isFinite(limit) ? limit : undefined,
        delayMs: Number.isFinite(delayMs) ? delayMs : undefined,
        force,
        since,
        until,
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
      const limit = Number.isFinite(limitRaw)
        ? Math.min(Math.max(limitRaw, 1), 200)
        : 30;
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
      // since/until: no-op for lifetime media metrics (documented)

      try {
        const result = await fetchPostInsights(match.ctx, postId, { force });
        sendJson(match.res, 200, result);
      } catch (error) {
        if (
          error instanceof ValidationError &&
          error.message === "post not found"
        ) {
          sendError(match.res, 404, error.message);
          return;
        }
        throw error;
      }
    },
    { paramNames: ["postId"] },
  ),
]);
