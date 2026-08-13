import type { ServerResponse } from "node:http";
import { BodyTooLargeError, sendApiError, sendError, ValidationError } from "./json.ts";
import { MetaNotConnectedError } from "../domain/meta/meta-readiness.ts";
import { PublishNotConfiguredError } from "../domain/posts/publish-post.ts";
import { AssetIngestError } from "../domain/posts/asset-ingest.ts";
import { ImageOptimizationError } from "../ports/image-optimizer.ts";
import { MetaConversationsRateLimitError } from "../adapters/meta/graph-api-conversations-reader.ts";

export type MapHttpErrorOptions = {
  upstream502?: boolean;
};

export function mapHttpError(
  res: ServerResponse,
  error: unknown,
  options: MapHttpErrorOptions = {},
): void {
  if (error instanceof MetaNotConnectedError) {
    sendApiError(res, 422, error.message, error.code);
    return;
  }

  if (error instanceof PublishNotConfiguredError) {
    sendApiError(res, 503, error.message, error.code);
    return;
  }

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

  if (error instanceof ValidationError) {
    sendError(res, 422, error.message);
    return;
  }

  if (error instanceof BodyTooLargeError) {
    sendError(res, 413, error.message);
    return;
  }

  if (error instanceof MetaConversationsRateLimitError) {
    sendError(res, 429, error.message);
    return;
  }

  if (options.upstream502 && error instanceof Error && error.message.trim()) {
    sendError(res, 502, error.message);
    return;
  }

  sendError(res, 500, "internal server error");
}
