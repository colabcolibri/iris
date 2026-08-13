import { composeRouters } from "../../router.ts";
import { messagesReplyRouter } from "./reply-routes.ts";
import { messagesInspectionRouter } from "./inspection-routes.ts";

export const handleMessagesRoute = composeRouters([
  messagesReplyRouter,
  messagesInspectionRouter,
]);
