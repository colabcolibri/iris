import type { ServerResponse } from "node:http";
import {
  BodyTooLargeError,
  sendCodedError,
  sendError,
  ValidationError,
} from "./json.ts";
import { MultipartParseError } from "./multipart.ts";
import { MetaNotConnectedError } from "../domain/meta/meta-readiness.ts";
import { PublishNotConfiguredError } from "../domain/posts/publish-post.ts";
import { AssetIngestError } from "../domain/posts/asset-ingest.ts";
import { ImageOptimizationError } from "../ports/image-optimizer.ts";
import { MetaConversationsRateLimitError } from "../adapters/meta/graph-api-conversations-reader.ts";
import {
  MetaMessageSendError,
  MetaMessageWindowExpiredError,
} from "../ports/meta-message-sender.ts";
import { ErrorCodes } from "../domain/errors/error-codes.ts";

export type MapHttpErrorOptions = {
  upstream502?: boolean;
};

export function mapHttpError(
  res: ServerResponse,
  error: unknown,
  options: MapHttpErrorOptions = {},
): void {
  if (error instanceof MetaNotConnectedError) {
    sendCodedError(res, 422, error.code, error.details);
    return;
  }

  if (error instanceof PublishNotConfiguredError) {
    sendCodedError(res, 503, error.code);
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
    sendCodedError(res, 422, error.code, error.details);
    return;
  }

  if (error instanceof BodyTooLargeError) {
    sendCodedError(res, 413, error.code);
    return;
  }

  if (error instanceof MetaConversationsRateLimitError) {
    sendCodedError(res, 429, error.code);
    return;
  }

  if (error instanceof MetaMessageWindowExpiredError) {
    sendCodedError(res, 422, ErrorCodes.MESSAGING_WINDOW_EXPIRED, {
      message: error.message,
    });
    return;
  }

  if (error instanceof MetaMessageSendError) {
    const status = error.code === "rate_limit" ? 429 : 502;
    const code =
      error.code === "rate_limit"
        ? ErrorCodes.RATE_LIMITED
        : error.code === "permission_denied"
          ? ErrorCodes.META_PERMISSION_DENIED
          : error.code === "thread_owner"
            ? ErrorCodes.META_THREAD_OWNER
            : ErrorCodes.META_SEND_FAILED;
    sendCodedError(res, status, code, {
      message: error.message,
      ...(error.metaCode != null ? { meta_code: error.metaCode } : {}),
      ...(error.metaSubcode != null ? { meta_subcode: error.metaSubcode } : {}),
    });
    return;
  }

  if (options.upstream502 && error instanceof Error && error.message.trim()) {
    sendError(res, 502, error.message);
    return;
  }

  sendError(res, 500, "internal server error");
}
