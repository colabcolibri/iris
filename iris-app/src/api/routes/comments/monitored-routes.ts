import { readJsonBody, sendJson } from "../../json.ts";
import { createRouter, route } from "../../router.ts";
import { serializePost } from "../../../adapters/sqlite/mappers.ts";
import { registerMonitoredPost } from "../../../domain/comments/register-monitored-post.ts";
import { registerMonitoredPostsBatch } from "../../../domain/comments/register-monitored-posts-batch.ts";

export const commentsMonitoredRouter = createRouter([
  route(
    "POST",
    "/api/comments/monitored-posts/batch",
    { admin: true, metaReady: true },
    async (match) => {
      const body = await readJsonBody<{ ig_media_ids?: unknown }>(match.req);
      const result = await registerMonitoredPostsBatch(body.ig_media_ids, {
        posts: match.ctx.posts,
        metaCommentReader: match.ctx.metaCommentReader,
      });

      sendJson(match.res, 201, {
        imported: result.imported.map(serializePost),
        skipped: result.skipped,
      });
    },
    { errorOptions: { upstream502: true } },
  ),

  route(
    "POST",
    "/api/comments/monitored-posts",
    { admin: true, metaReady: true },
    async (match) => {
      const body = await readJsonBody<{
        ig_media_id?: unknown;
        permalink?: unknown;
      }>(match.req);
      const post = await registerMonitoredPost(body, {
        posts: match.ctx.posts,
        metaCommentReader: match.ctx.metaCommentReader,
      });

      sendJson(match.res, 201, serializePost(post));
    },
    { errorOptions: { upstream502: true } },
  ),
]);
