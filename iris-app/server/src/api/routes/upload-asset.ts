import type { IncomingMessage, ServerResponse } from "node:http";
import type { AppContext } from "../app-context.ts";
import { sendError, sendJson } from "../json.ts";
import { mapHttpError } from "../map-http-error.ts";
import { parseMultipart } from "../multipart.ts";
import { serializeAsset } from "../../adapters/sqlite/mappers.ts";
import { notifyPostsChanged } from "../../adapters/sse/event-bus.ts";
import { getImageLimits } from "../../domain/posts/image-limits.ts";
import { ingestPostAsset } from "../../domain/posts/asset-ingest.ts";
import {
  redeemUploadJti,
  verifyUploadSig,
} from "../../domain/posts/upload-url.ts";

export async function handleUploadAssetRoute(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
  pathname: string,
): Promise<boolean> {
  if (!pathname.startsWith("/upload/assets/")) {
    return false;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    });
    res.end();
    return true;
  }

  if (req.method !== "POST") {
    sendError(res, 405, "method not allowed");
    return true;
  }

  const parts = pathname.split("/").filter(Boolean);
  // /upload/assets/:sig/:postId → ["upload", "assets", sig, postId]
  if (parts.length !== 4 || parts[0] !== "upload" || parts[1] !== "assets") {
    sendError(res, 404, "Not found");
    return true;
  }

  const sig = decodeURIComponent(parts[2] ?? "");
  const postId = decodeURIComponent(parts[3] ?? "");
  const url = new URL(req.url ?? "/", "http://localhost");
  const expiresAt = Number(url.searchParams.get("exp"));
  const sortOrder = Number.parseInt(url.searchParams.get("sort") ?? "", 10);
  const filename = url.searchParams.get("fn") ?? "";
  const jti = url.searchParams.get("jti") ?? "";

  if (
    !ctx.publishUrlSecret ||
    !filename ||
    !jti ||
    !Number.isFinite(sortOrder) ||
    sortOrder < 1 ||
    !verifyUploadSig(
      sig,
      postId,
      sortOrder,
      filename,
      jti,
      expiresAt,
      ctx.publishUrlSecret,
    )
  ) {
    sendError(res, 403, "invalid or expired upload url");
    return true;
  }

  if (!redeemUploadJti(jti, expiresAt)) {
    sendError(res, 403, "upload url already used or expired");
    return true;
  }

  try {
    const limits = getImageLimits();
    const parsed = await parseMultipart(req, limits.uploadMaxBytes);
    const file = parsed.files.find((item) => item.fieldName === "file");
    if (!file) {
      sendError(res, 422, "file field is required");
      return true;
    }

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
        filename,
        sortOrder,
      },
    );

    notifyPostsChanged({ post_id: postId });
    sendJson(res, 201, serializeAsset(asset));
  } catch (error) {
    mapHttpError(res, error);
  }

  return true;
}
