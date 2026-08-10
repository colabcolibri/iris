import type { IncomingMessage, ServerResponse } from "node:http";
import type { AuthContext } from "../auth.ts";
import type { AppContext } from "../app-context.ts";
import { getImageLimits } from "../../domain/image-limits.ts";
import { BodyTooLargeError, sendError } from "../json.ts";
import { MultipartParseError, parseMultipart } from "../multipart.ts";
import { ImageOptimizationError } from "../../ports/image-optimizer.ts";
import { serializeAsset } from "../../adapters/sqlite/mappers.ts";
import { sendJson } from "../json.ts";
import { notifyPostsChanged } from "../../adapters/sse/event-bus.ts";
import {
  AssetIngestError,
  ingestPostAsset,
} from "../../domain/asset-ingest.ts";

type RouteRequest = {
  req: IncomingMessage;
  res: ServerResponse;
  ctx: AppContext;
  auth: AuthContext;
};

export async function handleAssetsRoute(request: RouteRequest): Promise<boolean> {
  const { req, res, ctx, auth } = request;
  const { pathname } = new URL(req.url ?? "/", "http://localhost");

  const listMatch = /^\/api\/posts\/([^/]+)\/assets$/.exec(pathname);
  if (listMatch) {
    const postId = listMatch[1];

    if (req.method === "GET") {
      const post = ctx.posts.findById(postId);
      if (!post) {
        sendError(res, 404, "post not found");
        return true;
      }

      const assets = ctx.assets.listByPostId(postId).map(serializeAsset);
      sendJson(res, 200, { assets });
      return true;
    }

    if (req.method === "POST") {
      try {
        const limits = getImageLimits();
        const parsed = await parseMultipart(req, limits.uploadMaxBytes);
        const file = parsed.files.find((item) => item.fieldName === "file");

        if (!file) {
          sendError(res, 422, "file field is required");
          return true;
        }

        const sortOrder = Number.parseInt(parsed.fields.sort_order ?? "1", 10);

        const asset = await ingestPostAsset(
          {
            posts: ctx.posts,
            assets: ctx.assets,
            mediaStorage: ctx.mediaStorage,
            imageOptimizer: ctx.imageOptimizer,
          },
          {
            postId,
            buffer: file.data,
            filename: file.filename,
            sortOrder,
          },
        );

        notifyPostsChanged({ post_id: postId });
        sendJson(res, 201, serializeAsset(asset));
      } catch (error) {
        handleAssetsError(res, error);
      }
      return true;
    }

    return false;
  }

  const fileMatch = /^\/api\/posts\/([^/]+)\/assets\/([^/]+)$/.exec(pathname);
  if (fileMatch && req.method === "GET") {
    const postId = fileMatch[1];
    const filename = fileMatch[2];
    const post = ctx.posts.findById(postId);

    if (!post) {
      sendError(res, 404, "post not found");
      return true;
    }

    const asset = ctx.assets.findByPostIdAndFilename(postId, filename);
    if (!asset) {
      sendError(res, 404, "asset not found");
      return true;
    }

    const file = await ctx.mediaStorage.read(postId, filename);
    if (!file) {
      sendError(res, 404, "asset not found");
      return true;
    }

    res.writeHead(200, { "Content-Type": file.mime });
    res.end(file.buffer);
    return true;
  }

  return false;
}

function handleAssetsError(res: ServerResponse, error: unknown): void {
  if (error instanceof AssetIngestError) {
    sendError(res, error.status, error.message);
    return;
  }

  if (error instanceof ImageOptimizationError) {
    sendError(res, error.status, error.message);
    return;
  }

  if (error instanceof MultipartParseError) {
    sendError(res, 422, error.message);
    return;
  }

  if (error instanceof BodyTooLargeError) {
    sendError(res, 413, error.message);
    return;
  }

  sendError(res, 500, "internal server error");
}
