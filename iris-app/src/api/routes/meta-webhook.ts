import type { IncomingMessage, ServerResponse } from "node:http";
import type { AppContext } from "../app-context.ts";
import { BodyTooLargeError, readRawBody, sendError } from "../json.ts";
import {
  parseCommentEntries,
  verifyHubSignature,
  verifySubscribeToken,
} from "../../domain/meta-webhook.ts";
import { notifyCommentsChanged } from "../../adapters/sse/event-bus.ts";

export function handleMetaWebhookRoute(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
  pathname: string,
): Promise<boolean> {
  if (pathname !== "/webhooks/meta") {
    return Promise.resolve(false);
  }

  if (req.method === "GET") {
    const url = new URL(req.url ?? "/", "http://localhost");
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (
      mode !== "subscribe" ||
      !challenge ||
      !verifySubscribeToken(token, ctx.metaWebhookVerifyToken ?? "")
    ) {
      sendError(res, 403, "invalid verify token");
      return Promise.resolve(true);
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(challenge);
    return Promise.resolve(true);
  }

  if (req.method !== "POST") {
    sendError(res, 405, "method not allowed");
    return Promise.resolve(true);
  }

  return handleMetaWebhookPost(req, res, ctx);
}

async function handleMetaWebhookPost(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: AppContext,
): Promise<boolean> {
  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers["x-hub-signature-256"];
    const signatureHeader = Array.isArray(signature) ? signature[0] : signature;

    if (
      !verifyHubSignature(
        rawBody,
        signatureHeader,
        ctx.metaAppSecret ?? "",
      )
    ) {
      sendError(res, 403, "invalid signature");
      return true;
    }

    const payload = JSON.parse(rawBody.toString("utf8")) as unknown;
    const entries = parseCommentEntries(payload);
    const affectedPosts = new Set<string>();

    for (const entry of entries) {
      const post = ctx.posts.findByIgMediaId(entry.igMediaId);
      if (!post) {
        continue;
      }

      const result = ctx.comments.upsertFromWebhook({
        igCommentId: entry.igCommentId,
        postId: post.id,
        parentIgCommentId: entry.parentIgCommentId,
        authorUsername: entry.authorUsername,
        text: entry.text,
      });

      if (result.created) {
        affectedPosts.add(post.id);
      }
    }

    for (const postId of affectedPosts) {
      notifyCommentsChanged({ post_id: postId });
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return true;
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      sendError(res, 413, error.message);
      return true;
    }

    sendError(res, 500, "internal server error");
    return true;
  }
}
