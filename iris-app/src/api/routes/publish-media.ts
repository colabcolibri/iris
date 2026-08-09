import type { IncomingMessage, ServerResponse } from "node:http";
import type { AppContext } from "../app-context.ts";
import { sendError } from "../json.ts";
import { verifyPublishSig } from "../../domain/publish-url.ts";

export function handlePublishMediaRoute(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
  pathname: string,
): boolean {
  if (req.method !== "GET" || !pathname.startsWith("/publish/media/")) {
    return false;
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length !== 4) {
    sendError(res, 404, "Not found");
    return true;
  }

  const [, , sigEncoded, postIdEncoded, filenameEncoded] = parts;
  const sig = decodeURIComponent(sigEncoded);
  const postId = decodeURIComponent(postIdEncoded);
  const filename = decodeURIComponent(filenameEncoded);
  const url = new URL(req.url ?? "/", "http://localhost");
  const expiresAt = Number(url.searchParams.get("exp"));

  if (
    !ctx.publishUrlSecret ||
    !verifyPublishSig(sig, postId, filename, expiresAt, ctx.publishUrlSecret)
  ) {
    sendError(res, 403, "invalid or expired publish url");
    return true;
  }

  const asset = ctx.assets.findByPostIdAndFilename(postId, filename);
  if (!asset) {
    sendError(res, 404, "asset not found");
    return true;
  }

  void ctx.mediaStorage.read(postId, filename).then((file) => {
    if (!file) {
      sendError(res, 404, "asset not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": file.mime,
      "Cache-Control": "private, max-age=60",
    });
    res.end(file.buffer);
  });

  return true;
}
