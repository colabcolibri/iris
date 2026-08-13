import type { IncomingMessage, ServerResponse } from "node:http";
import { ErrorCodes, isErrorCode } from "../domain/errors/error-codes.ts";

export const JSON_BODY_LIMIT = 16 * 1024;

export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

export function sendError(res: ServerResponse, status: number, message: string): void {
  sendJson(res, status, { error: message });
}

/** @deprecated Prefer sendCodedError for user-facing API errors. */
export function sendApiError(
  res: ServerResponse,
  status: number,
  message: string,
  code?: string,
): void {
  const body: { error: string; code?: string } = { error: message };
  if (code) {
    body.code = code;
  }
  sendJson(res, status, body);
}

export function sendCodedError(
  res: ServerResponse,
  status: number,
  code: string,
  details?: Record<string, unknown>,
): void {
  sendJson(res, status, {
    error: details ? { code, details } : { code },
  });
}

export async function readRawBody(
  req: IncomingMessage,
  limit = JSON_BODY_LIMIT,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > limit) {
      throw new BodyTooLargeError();
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}

export async function readJsonBody<T extends Record<string, unknown>>(
  req: IncomingMessage,
  limit = JSON_BODY_LIMIT,
): Promise<T> {
  const raw = await readRawBody(req, limit);
  if (raw.length === 0) {
    return {} as T;
  }

  return JSON.parse(raw.toString("utf8")) as T;
}

export class BodyTooLargeError extends Error {
  readonly code = ErrorCodes.BODY_TOO_LARGE;

  constructor() {
    super("Request body too large");
    this.name = "BodyTooLargeError";
  }
}

export class ValidationError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(codeOrMessage: string, details?: Record<string, unknown>) {
    if (isErrorCode(codeOrMessage)) {
      super(codeOrMessage);
      this.code = codeOrMessage;
      this.details = details;
    } else {
      super(codeOrMessage);
      this.code = ErrorCodes.VALIDATION_FAILED;
      this.details = details
        ? { message: codeOrMessage, ...details }
        : { message: codeOrMessage };
    }
    this.name = "ValidationError";
  }
}

export function validationError(
  code: string,
  details?: Record<string, unknown>,
): ValidationError {
  return new ValidationError(code, details);
}
