import type { IncomingMessage } from "node:http";
import { BodyTooLargeError } from "./json.ts";

export type MultipartFile = {
  fieldName: string;
  filename: string;
  mime: string;
  data: Buffer;
};

export type ParsedMultipart = {
  fields: Record<string, string>;
  files: MultipartFile[];
};

export async function parseMultipart(
  req: IncomingMessage,
  maxBytes: number,
): Promise<ParsedMultipart> {
  const contentType = req.headers["content-type"] ?? "";
  const boundaryMatch = /boundary=(.+)$/i.exec(contentType);

  if (!contentType.includes("multipart/form-data") || !boundaryMatch) {
    throw new MultipartParseError("expected multipart/form-data");
  }

  const boundary = boundaryMatch[1].replace(/^"|"$/g, "");
  const body = await readBody(req, maxBytes);
  const parts = splitMultipart(body, `--${boundary}`);
  const fields: Record<string, string> = {};
  const files: MultipartFile[] = [];

  for (const part of parts) {
    if (!part.trim() || part.trim() === "--") {
      continue;
    }

    const separator = part.indexOf("\r\n\r\n");
    if (separator === -1) {
      continue;
    }

    const headerText = part.slice(0, separator);
    const rawContent = part.slice(separator + 4);
    const content = rawContent.endsWith("\r\n")
      ? rawContent.slice(0, -2)
      : rawContent;

    const disposition = /content-disposition:[^\r\n]+/i.exec(headerText)?.[0] ?? "";
    const nameMatch = /name="([^"]+)"/i.exec(disposition);
    if (!nameMatch) {
      continue;
    }

    const fieldName = nameMatch[1];
    const filenameMatch = /filename="([^"]*)"/i.exec(disposition);

    if (filenameMatch) {
      const mime =
        /content-type:\s*([^\r\n]+)/i.exec(headerText)?.[1]?.trim() ??
        "application/octet-stream";
      files.push({
        fieldName,
        filename: filenameMatch[1],
        mime,
        data: Buffer.from(content, "binary"),
      });
      continue;
    }

    fields[fieldName] = Buffer.from(content, "binary").toString("utf8");
  }

  return { fields, files };
}

export class MultipartParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MultipartParseError";
  }
}

async function readBody(req: IncomingMessage, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) {
      throw new BodyTooLargeError();
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}

function splitMultipart(body: Buffer, boundary: string): string[] {
  return body
    .toString("binary")
    .split(boundary)
    .slice(1);
}
