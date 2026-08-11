import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../../api/app-context.ts";
import { buildUploadAssetUrl } from "../../domain/posts/upload-url.ts";
import { jsonToolContent, toolError } from "../tool-response.ts";

export function registerAssetTools(server: McpServer, ctx: AppContext): void {
  server.tool(
    "iris_prepare_post_asset_upload",
    "Prepare a one-shot signed multipart upload for a post image. Returns upload_url and curl_command — put the local file path in place of LOCAL_IMAGE_PATH and run curl. Do not base64-encode image bytes into MCP.",
    {
      postId: z.string().min(1),
      filename: z.string().min(1),
      sortOrder: z.number().int().positive().default(1),
    },
    async (args) => {
      const post = ctx.posts.findById(args.postId);
      if (!post) {
        return toolError("post not found");
      }

      const baseUrl = ctx.publicBaseUrl?.trim();
      const secret = ctx.publishUrlSecret?.trim();
      if (!baseUrl || !secret) {
        return toolError(
          "IRIS_PUBLIC_BASE_URL and IRIS_PUBLISH_URL_SECRET are required for MCP asset upload",
        );
      }

      try {
        const prepared = buildUploadAssetUrl({
          postId: args.postId,
          filename: args.filename,
          sortOrder: args.sortOrder,
          baseUrl,
          secret,
        });

        return jsonToolContent({
          post_id: args.postId,
          filename: prepared.filename,
          sort_order: prepared.sortOrder,
          upload_url: prepared.uploadUrl,
          expires_at: new Date(prepared.expiresAt).toISOString(),
          max_bytes: prepared.maxBytes,
          curl_command: prepared.curlCommand,
          instructions:
            "Replace LOCAL_IMAGE_PATH with the absolute path to the image file, then run curl_command from the host shell. Bytes must never enter the MCP tool call.",
        });
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "failed to prepare upload",
        );
      }
    },
  );
}
