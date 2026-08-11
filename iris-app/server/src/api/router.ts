import { sendError } from "./json.ts";
import { mapHttpError, type MapHttpErrorOptions } from "./map-http-error.ts";
import { guardAdmin, guardAdminOrAgent, guardMetaReady } from "./route-guards.ts";
import type {
  RouteDispatcher,
  RouteHandler,
  RouteMatch,
  RouteRequest,
} from "./route-types.ts";

export type RouteOptions = {
  admin?: boolean;
  adminOrAgent?: boolean;
  metaReady?: boolean;
};

export type RouteDefinition = {
  method: string;
  path: string | RegExp;
  paramNames?: string[];
  options?: RouteOptions;
  onError?: (res: RouteMatch["res"], error: unknown) => void;
  errorOptions?: MapHttpErrorOptions;
  handler: RouteHandler;
};

function buildMatch(request: RouteRequest, params: Record<string, string>): RouteMatch {
  const url = new URL(request.req.url ?? "/", "http://localhost");
  return {
    ...request,
    pathname: url.pathname,
    searchParams: url.searchParams,
    params,
  };
}

function paramsFromMatch(
  exec: RegExpExecArray,
  paramNames?: string[],
): Record<string, string> {
  if (!paramNames?.length) {
    return {};
  }

  const params: Record<string, string> = {};
  for (let index = 0; index < paramNames.length; index += 1) {
    const name = paramNames[index];
    const value = exec[index + 1];
    if (name && value) {
      params[name] = value;
    }
  }
  return params;
}

function runGuards(match: RouteMatch, options?: RouteOptions): boolean {
  if (options?.admin && !guardAdmin(match)) {
    return false;
  }

  if (options?.adminOrAgent && !guardAdminOrAgent(match)) {
    return false;
  }

  if (options?.metaReady && !guardMetaReady(match)) {
    return false;
  }

  return true;
}

export function route(
  method: string,
  path: string | RegExp,
  optionsOrHandler: RouteOptions | RouteHandler,
  maybeHandlerOrExtras?:
    | RouteHandler
    | Pick<RouteDefinition, "paramNames" | "onError" | "errorOptions">,
  maybeExtras?: Pick<RouteDefinition, "paramNames" | "onError" | "errorOptions">,
): RouteDefinition {
  if (typeof optionsOrHandler === "function") {
    return {
      method,
      path,
      handler: optionsOrHandler,
      ...(maybeHandlerOrExtras && typeof maybeHandlerOrExtras !== "function"
        ? maybeHandlerOrExtras
        : {}),
    };
  }

  const handler = maybeHandlerOrExtras;
  if (typeof handler !== "function") {
    throw new Error("route(): handler function is required");
  }

  return {
    method,
    path,
    options: optionsOrHandler,
    handler,
    ...maybeExtras,
  };
}

export function createRouter(definitions: RouteDefinition[]): RouteDispatcher {
  return async (request: RouteRequest): Promise<boolean> => {
    const url = new URL(request.req.url ?? "/", "http://localhost");
    const method = request.req.method ?? "GET";

    for (const definition of definitions) {
      if (definition.method !== method) {
        continue;
      }

      let params: Record<string, string> = {};

      if (typeof definition.path === "string") {
        if (definition.path !== url.pathname) {
          continue;
        }
      } else {
        const exec = definition.path.exec(url.pathname);
        if (!exec) {
          continue;
        }
        params = paramsFromMatch(exec, definition.paramNames);
      }

      const match = buildMatch(request, params);

      if (!runGuards(match, definition.options)) {
        return true;
      }

      try {
        await definition.handler(match);
      } catch (error) {
        if (definition.onError) {
          definition.onError(match.res, error);
        } else {
          mapHttpError(match.res, error, definition.errorOptions);
        }
      }

      return true;
    }

    return false;
  };
}

export function composeRouters(routers: RouteDispatcher[]): RouteDispatcher {
  return async (request: RouteRequest): Promise<boolean> => {
    for (const router of routers) {
      if (await router(request)) {
        return true;
      }
    }
    return false;
  };
}

export function createAdminPathRouter(
  path: string,
  handlers: Partial<Record<string, RouteHandler>>,
  options?: { metaReady?: boolean },
): RouteDispatcher {
  return async (request: RouteRequest): Promise<boolean> => {
    const url = new URL(request.req.url ?? "/", "http://localhost");
    if (url.pathname !== path) {
      return false;
    }

    const match = buildMatch(request, {});
    if (!guardAdmin(match)) {
      return true;
    }

    if (options?.metaReady && !guardMetaReady(match)) {
      return true;
    }

    const handler = handlers[request.req.method ?? ""];
    if (!handler) {
      sendError(match.res, 405, "method not allowed");
      return true;
    }

    try {
      await handler(match);
    } catch (error) {
      mapHttpError(match.res, error);
    }

    return true;
  };
}
