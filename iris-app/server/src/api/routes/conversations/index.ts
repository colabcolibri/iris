import { composeRouters } from "../../router.ts";
import { conversationsActivityRouter } from "./activity-routes.ts";
import { conversationsDetailRouter } from "./detail-routes.ts";

export const handleConversationsRoute = composeRouters([
  conversationsActivityRouter,
  conversationsDetailRouter,
]);
