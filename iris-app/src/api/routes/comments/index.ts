import { composeRouters } from "../../router.ts";
import { commentsInboxRouter } from "./inbox-routes.ts";
import { commentsMonitoredRouter } from "./monitored-routes.ts";
import { commentsPostCommentsRouter } from "./post-comments-routes.ts";
import { commentsInspectionRouter } from "./inspection-routes.ts";
import { commentsReplyRouter } from "./reply-routes.ts";
import { commentsActivityRouter } from "./activity-routes.ts";

export const handleCommentsRoute = composeRouters([
  commentsInboxRouter,
  commentsActivityRouter,
  commentsMonitoredRouter,
  commentsPostCommentsRouter,
  commentsInspectionRouter,
  commentsReplyRouter,
]);
