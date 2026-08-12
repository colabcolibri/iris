import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../../api/app-context.ts";
import { serializeAsset } from "../../adapters/sqlite/mappers.ts";
import { notifyPostsChanged } from "../../adapters/sse/event-bus.ts";
import { ValidationError } from "../../api/json.ts";
import { generateCarouselSummaryForPost } from "../../domain/carousel-summary/generate-carousel-summary.ts";
import { AssetIngestError } from "../../domain/posts/asset-ingest.ts";
import { deletePostAsset } from "../../domain/posts/post-assets.ts";
import {
  buildPublishImageUrl,
  filenameFromStoragePath,
} from "../../domain/posts/publish-url.ts";
import { buildUploadAssetUrl } from "../../domain/posts/upload-url.ts";
import { jsonToolContent, toolError } from "../tool-response.ts";

function signedAssetUrl(
  ctx: AppContext,
  postId: string,
  storagePath: string,
): string | null {
  const baseUrl = ctx.publicBaseUrl?.trim();
  const secret = ctx.publishUrlSecret?.trim();
  if (!baseUrl || !secret) {
    return null;
  }
  const filename = filenameFromStoragePath(storagePath);
  return buildPublishImageUrl(postId, filename, baseUrl, secret);
}

export function registerAssetTools(server: McpServer, ctx: AppContext): void {
  server.tool(
    "iris_list_post_assets",
    "List image assets for a post with metadata and short-lived signed URLs (no image bytes in the tool response)",
    {
      postId: z.string().min(1),
    },
    async (args) => {
      const post = ctx.posts.findById(args.postId);
      if (!post) {
        return toolError("post not found");
      }

      const assets = ctx.assets.listByPostId(args.postId).map((asset) => ({
        ...serializeAsset(asset),
        url: signedAssetUrl(ctx, args.postId, asset.storagePath),
      }));
      return jsonToolContent({ post_id: args.postId, assets });
    },
  );

  server.tool(
    "iris_prepare_post_asset_upload",
    "Prepare a one-shot signed multipart upload for a post image. sortOrder is 1-based carousel order (first slide = 1, never 0). Returns upload_url and curl_command — put the local file path in place of LOCAL_IMAGE_PATH and run curl. Do not base64-encode image bytes into MCP.",
    {
      postId: z.string().min(1),
      filename: z.string().min(1),
      sortOrder: z
        .number()
        .int()
        .positive()
        .default(1)
        .describe(
          "1-based carousel position: first image is 1, second is 2, … Never use 0.",
        ),
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
            "sortOrder is 1-based (first slide = 1). Replace LOCAL_IMAGE_PATH with the absolute path to the image file, then run curl_command from the host shell. Bytes must never enter the MCP tool call.",
        });
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "failed to prepare upload",
        );
      }
    },
  );

  server.tool(
    "iris_delete_post_asset",
    "Delete a post image asset by id — removes the database row and the file under data/media/",
    {
      postId: z.string().min(1),
      assetId: z.string().min(1),
    },
    async (args) => {
      try {
        await deletePostAsset(args.postId, args.assetId, {
          posts: ctx.posts,
          assets: ctx.assets,
          mediaStorage: ctx.mediaStorage,
        });
        notifyPostsChanged({ post_id: args.postId });
        return jsonToolContent({
          deleted: true,
          post_id: args.postId,
          asset_id: args.assetId,
        });
      } catch (error) {
        if (error instanceof AssetIngestError) {
          return toolError(error.message);
        }
        return toolError(
          error instanceof Error ? error.message : "delete failed",
        );
      }
    },
  );

  server.tool(
    "iris_generate_post_carousel_summary",
    "Generate posts.carousel_summary (visual carousel/reel description for reply context) from the post images using server-side LLM vision — same as admin UI Resumo. Does NOT write reply_prompt/briefing; does not send caption to the model.",
    {
      postId: z.string().min(1),
    },
    async (args) => {
      try {
        const llmConfig = ctx.llmConfigResolver.resolve();
        const persona = ctx.replyPersonaStore.get();
        const summary = await generateCarouselSummaryForPost(args.postId, {
          posts: ctx.posts,
          assets: ctx.assets,
          metaCommentReader: ctx.metaCommentReader,
          publicBaseUrl: ctx.publicBaseUrl,
          publishUrlSecret: ctx.publishUrlSecret,
          mediaStorage: ctx.mediaStorage,
          llm: ctx.resolveLlmCompleter(),
          responseLanguage: persona?.responseLanguage,
          visionEnabled: llmConfig?.supportsVision ?? false,
        });
        notifyPostsChanged({ post_id: args.postId });
        return jsonToolContent({
          post_id: args.postId,
          carousel_summary: summary,
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          return toolError(error.message);
        }
        return toolError(
          error instanceof Error ? error.message : "generate failed",
        );
      }
    },
  );
}
