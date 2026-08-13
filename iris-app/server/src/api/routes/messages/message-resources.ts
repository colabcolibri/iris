import { sendError } from "../../json.ts";
import type { RouteMatch } from "../../route-types.ts";

export function requireMessage(match: RouteMatch, messageId: string) {
  const message = match.ctx.messages.findById(messageId);
  if (!message) {
    sendError(match.res, 404, "message not found");
    return null;
  }
  return message;
}
