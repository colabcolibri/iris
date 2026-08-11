import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../../api/app-context.ts";
import { serializeAsset } from "../../adapters/sqlite/mappers.ts";
import { notifyPostsChanged } from "../../adapters/sse/event-bus.ts";
import {
  AssetIngestError,
  ingestPostAsset,
} from "../../domain/posts/asset-ingest.ts";
import { jsonToolContent, toolError } from "../tool-response.ts";

export function registerAssetTools(server: McpServer, ctx: AppContext): void {
  server.tool(
    "iris_upload_post_asset",
    "Upload an image asset to a post using base64 payload",
    {
      postId: z.string().min(1),
      base64: z.string().min(1),
      filename: z.string().min(1),
      mime: z.string().optional(),
      sortOrder: z.number().int().positive().default(1),
    },
    async (args) => {
      try {
        const buffer = Buffer.from(args.base64, "base64");
        if (buffer.length === 0) {
          return toolError("invalid base64 payload");
        }

        const asset = await ingestPostAsset(
          {
            posts: ctx.posts,
            assets: ctx.assets,
            mediaStorage: ctx.mediaStorage,
            imageOptimizer: ctx.imageOptimizer,
          },
          {
            postId: args.postId,
            buffer,
            filename: args.filename,
            mime: args.mime,
            sortOrder: args.sortOrder,
          },
        );

        notifyPostsChanged({ post_id: args.postId });
        return jsonToolContent(serializeAsset(asset));
      } catch (error) {
        if (error instanceof AssetIngestError) {
          return toolError(error.message);
        }
        return toolError(error instanceof Error ? error.message : "upload failed");
      }
    },
  );
}
