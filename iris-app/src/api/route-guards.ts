import { requireAdmin } from "./auth.ts";
import { sendError } from "./json.ts";
import {
  getMetaReadiness,
  metaReadinessMessage,
} from "../domain/meta-readiness.ts";
import type { RouteMatch } from "./route-types.ts";

export function guardAdmin(match: RouteMatch): boolean {
  if (!requireAdmin(match.auth)) {
    sendError(match.res, 403, "admin token required");
    return false;
  }
  return true;
}

export function guardAdminOrAgent(match: RouteMatch): boolean {
  if (match.auth.role !== "admin" && match.auth.role !== "agent") {
    sendError(match.res, 403, "admin or agent token required");
    return false;
  }
  return true;
}

export function guardMetaReady(match: RouteMatch): boolean {
  const readiness = getMetaReadiness(match.ctx);
  if (!readiness.ready) {
    sendError(match.res, 503, metaReadinessMessage(readiness));
    return false;
  }
  return true;
}
