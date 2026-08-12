import { readJsonBody, sendError, sendJson, ValidationError } from "../json.ts";
import { createRouter, route } from "../router.ts";
import { requirePost, routeParam } from "../route-resources.ts";
import { getImageLimits } from "../../domain/posts/image-limits.ts";
import { parseMultipart } from "../multipart.ts";
import { serializeAsset } from "../../adapters/sqlite/mappers.ts";
import { notifyPostsChanged } from "../../adapters/sse/event-bus.ts";
import {
  ingestPostAsset,
} from "../../domain/posts/asset-ingest.ts";
import {
  normalizeAltText,
  normalizeUserTags,
} from "../../domain/posts/asset-tags.ts";
import {
  deletePostAsset,
  reorderPostAssets,
} from "../../domain/posts/post-assets.ts";

export const handleAssetsRoute = createRouter([
  route(
    "GET",
    /^\/api\/posts\/([^/]+)\/assets$/,
    async (match) => {
      const postId = routeParam(match, "postId");
      if (!requirePost(match, postId)) {
        return;
      }

      const assets = match.ctx.assets.listByPostId(postId).map(serializeAsset);
      sendJson(match.res, 200, { assets });
    },
    { paramNames: ["postId"] },
  ),

  route(
    "POST",
    /^\/api\/posts\/([^/]+)\/assets$/,
    async (match) => {
      const postId = routeParam(match, "postId");
      const limits = getImageLimits();
      const parsed = await parseMultipart(match.req, limits.uploadMaxBytes);
      const file = parsed.files.find((item) => item.fieldName === "file");

      if (!file) {
        sendError(match.res, 422, "file field is required");
        return;
      }

      const sortOrder = Number.parseInt(parsed.fields.sort_order ?? "1", 10);
      const asset = await ingestPostAsset(
        {
          posts: match.ctx.posts,
          assets: match.ctx.assets,
          mediaStorage: match.ctx.mediaStorage,
          imageOptimizer: match.ctx.imageOptimizer,
        },
        {
          postId,
          buffer: file.data,
          filename: file.filename,
          sortOrder,
        },
      );

      notifyPostsChanged({ post_id: postId });
      sendJson(match.res, 201, serializeAsset(asset));
    },
    { paramNames: ["postId"] },
  ),

  route(
    "PUT",
    /^\/api\/posts\/([^/]+)\/assets\/reorder$/,
    async (match) => {
      const postId = routeParam(match, "postId");
      const body = await readJsonBody<{ asset_ids?: unknown }>(match.req);
      if (!Array.isArray(body.asset_ids)) {
        sendError(match.res, 422, "asset_ids must be an array");
        return;
      }

      const assetIds = body.asset_ids.filter((id): id is string => typeof id === "string");
      if (assetIds.length !== body.asset_ids.length) {
        sendError(match.res, 422, "asset_ids must contain strings only");
        return;
      }

      const assets = reorderPostAssets(postId, assetIds, {
        posts: match.ctx.posts,
        assets: match.ctx.assets,
        mediaStorage: match.ctx.mediaStorage,
      });

      notifyPostsChanged({ post_id: postId });
      sendJson(match.res, 200, { assets: assets.map(serializeAsset) });
    },
    { paramNames: ["postId"] },
  ),

  route(
    "PATCH",
    /^\/api\/posts\/([^/]+)\/assets\/([^/]+)$/,
    async (match) => {
      const postId = routeParam(match, "postId");
      const assetId = routeParam(match, "assetId");
      if (!requirePost(match, postId)) {
        return;
      }

      const asset = match.ctx.assets.findById(assetId);
      if (!asset || asset.postId !== postId) {
        sendError(match.res, 404, "asset not found");
        return;
      }

      const body = await readJsonBody<Record<string, unknown>>(match.req);
      try {
        const update: { altText?: string | null; userTags?: ReturnType<typeof normalizeUserTags> } =
          {};
        if ("alt_text" in body) {
          update.altText = normalizeAltText(body.alt_text);
        }
        if ("user_tags" in body) {
          update.userTags = normalizeUserTags(body.user_tags);
        }
        if (update.altText === undefined && update.userTags === undefined) {
          sendError(match.res, 422, "alt_text or user_tags required");
          return;
        }

        const updated = match.ctx.assets.update(assetId, update);
        if (!updated) {
          sendError(match.res, 404, "asset not found");
          return;
        }
        notifyPostsChanged({ post_id: postId });
        sendJson(match.res, 200, serializeAsset(updated));
      } catch (error) {
        if (error instanceof ValidationError) {
          sendError(match.res, 422, error.message);
          return;
        }
        throw error;
      }
    },
    { paramNames: ["postId", "assetId"] },
  ),

  route(
    "DELETE",
    /^\/api\/posts\/([^/]+)\/assets\/([^/]+)$/,
    async (match) => {
      const postId = routeParam(match, "postId");
      const assetId = routeParam(match, "assetId");

      await deletePostAsset(postId, assetId, {
        posts: match.ctx.posts,
        assets: match.ctx.assets,
        mediaStorage: match.ctx.mediaStorage,
      });
      notifyPostsChanged({ post_id: postId });
      match.res.writeHead(204);
      match.res.end();
    },
    { paramNames: ["postId", "assetId"] },
  ),

  route(
    "GET",
    /^\/api\/posts\/([^/]+)\/assets\/([^/]+)$/,
    async (match) => {
      const postId = routeParam(match, "postId");
      const filename = routeParam(match, "assetId");

      if (!requirePost(match, postId)) {
        return;
      }

      const asset = match.ctx.assets.findByPostIdAndFilename(postId, filename);
      if (!asset) {
        sendError(match.res, 404, "asset not found");
        return;
      }

      const file = await match.ctx.mediaStorage.read(postId, filename);
      if (!file) {
        sendError(match.res, 404, "asset not found");
        return;
      }

      match.res.writeHead(200, { "Content-Type": file.mime });
      match.res.end(file.buffer);
    },
    { paramNames: ["postId", "assetId"] },
  ),
]);
