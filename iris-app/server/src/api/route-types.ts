import type { IncomingMessage, ServerResponse } from "node:http";
import type { AuthContext } from "./auth.ts";
import type { AppContext } from "./app-context.ts";

export type RouteRequest = {
  req: IncomingMessage;
  res: ServerResponse;
  ctx: AppContext;
  auth: AuthContext;
};

export type RouteMatch = RouteRequest & {
  pathname: string;
  searchParams: URLSearchParams;
  params: Record<string, string>;
};

export type RouteHandler = (match: RouteMatch) => Promise<void> | void;

export type RouteDispatcher = (request: RouteRequest) => Promise<boolean>;
