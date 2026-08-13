import { readJsonBody, sendError, sendJson, ValidationError } from "../json.ts";
import { guardAdmin } from "../route-guards.ts";
import type { RouteRequest } from "../route-types.ts";
import type { StoreProviderType } from "../../domain/stores/store-types.ts";
import { serializeStoreConnection } from "../../domain/stores/serialize-store-connection.ts";
import { STORE_PROVIDER_TYPES } from "../../domain/stores/store-types.ts";

function readProviderType(value: unknown): StoreProviderType {
  if (typeof value !== "string" || !STORE_PROVIDER_TYPES.includes(value as StoreProviderType)) {
    throw new ValidationError("provider_type must be yampi, shopify or woocommerce");
  }
  return value as StoreProviderType;
}

function readYampiCredentials(body: Record<string, unknown>) {
  const alias = typeof body.alias === "string" ? body.alias.trim() : "";
  const userToken =
    typeof body.user_token === "string"
      ? body.user_token.trim()
      : typeof body.userToken === "string"
        ? body.userToken.trim()
        : "";
  const userSecretKey =
    typeof body.user_secret_key === "string"
      ? body.user_secret_key.trim()
      : typeof body.userSecretKey === "string"
        ? body.userSecretKey.trim()
        : "";

  if (!alias || !userToken || !userSecretKey) {
    throw new ValidationError("alias, user_token and user_secret_key are required for yampi");
  }

  return {
    providerType: "yampi" as const,
    yampi: { alias, userToken, userSecretKey },
  };
}

export async function handleStoreConnectionsRoute(request: RouteRequest): Promise<boolean> {
  const url = new URL(request.req.url ?? "/", "http://localhost");
  const pathname = url.pathname;
  if (!pathname.startsWith("/api/store-connections")) {
    return false;
  }

  const match = {
    ...request,
    pathname,
    searchParams: url.searchParams,
    params: {},
  };

  if (!guardAdmin(match)) {
    return true;
  }

  const ctx = request.ctx;

  if (pathname === "/api/store-connections" && request.req.method === "GET") {
    sendJson(request.res, 200, {
      store_connections: ctx.storeConnections.list().map(serializeStoreConnection),
    });
    return true;
  }

  if (pathname === "/api/store-connections" && request.req.method === "POST") {
    const body = await readJsonBody<Record<string, unknown>>(request.req);
    const providerType = readProviderType(body.provider_type);
    const label = typeof body.label === "string" ? body.label.trim() : "";
    if (!label) {
      sendError(request.res, 400, "label is required");
      return true;
    }

    const credentials =
      providerType === "yampi" ? readYampiCredentials(body) : null;
    if (!credentials) {
      sendError(request.res, 400, "only yampi is supported in v1.19");
      return true;
    }

    const created = ctx.storeConnections.create({
      providerType,
      label,
      credentials,
      settings:
        body.settings && typeof body.settings === "object" && !Array.isArray(body.settings)
          ? (body.settings as Record<string, unknown>)
          : {},
    });

    sendJson(request.res, 201, serializeStoreConnection(created));
    return true;
  }

  const idMatch = pathname.match(/^\/api\/store-connections\/([^/]+)$/);
  if (idMatch) {
    const id = idMatch[1]!;

    if (request.req.method === "GET") {
      const connection = ctx.storeConnections.findById(id);
      if (!connection) {
        sendError(request.res, 404, "store connection not found");
        return true;
      }
      sendJson(request.res, 200, serializeStoreConnection(connection));
      return true;
    }

    if (request.req.method === "PATCH") {
      const existing = ctx.storeConnections.findById(id);
      if (!existing) {
        sendError(request.res, 404, "store connection not found");
        return true;
      }

      const body = await readJsonBody<Record<string, unknown>>(request.req);
      const credentials =
        body.alias || body.user_token || body.userToken
          ? readYampiCredentials({ ...body, alias: body.alias ?? existing.label })
          : undefined;

      const updated = ctx.storeConnections.update(id, {
        label: typeof body.label === "string" ? body.label.trim() : undefined,
        credentials,
        settings:
          body.settings && typeof body.settings === "object" && !Array.isArray(body.settings)
            ? (body.settings as Record<string, unknown>)
            : undefined,
        status:
          body.status === "active" || body.status === "error" || body.status === "disconnected"
            ? body.status
            : undefined,
      });

      sendJson(request.res, 200, serializeStoreConnection(updated!));
      return true;
    }

    if (request.req.method === "DELETE") {
      const ok = ctx.storeConnections.remove(id);
      if (!ok) {
        sendError(request.res, 404, "store connection not found");
        return true;
      }
      sendJson(request.res, 200, { ok: true });
      return true;
    }
  }

  const testMatch = pathname.match(/^\/api\/store-connections\/([^/]+)\/test$/);
  if (testMatch && request.req.method === "POST") {
    const id = testMatch[1]!;
    const connection = ctx.storeConnections.findById(id);
    if (!connection) {
      sendError(request.res, 404, "store connection not found");
      return true;
    }

    const credentials = ctx.storeConnections.getCredentials(id);
    if (!credentials) {
      sendError(request.res, 400, "store connection has no credentials");
      return true;
    }

    try {
      const provider = ctx.storeProviders.get(connection.providerType);
      const result = await provider.testConnection(credentials);
      ctx.storeConnections.update(id, {
        status: result.ok ? "active" : "error",
        lastError: result.ok ? null : result.message,
      });
      sendJson(request.res, 200, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "test failed";
      ctx.storeConnections.update(id, { status: "error", lastError: message });
      sendError(request.res, 502, message);
    }
    return true;
  }

  const syncMatch = pathname.match(/^\/api\/store-connections\/([^/]+)\/sync$/);
  if (syncMatch && request.req.method === "POST") {
    const id = syncMatch[1]!;
    const importNew = url.searchParams.get("import_new") === "true";

    try {
      const result = await ctx.storeCatalogSync.syncStoreConnection(id, { importNew });
      sendJson(request.res, 200, result);
    } catch (error) {
      sendError(request.res, 400, error instanceof Error ? error.message : "sync failed");
    }
    return true;
  }

  const policiesMatch = pathname.match(/^\/api\/store-connections\/([^/]+)\/field-policies$/);
  if (policiesMatch) {
    const storeConnectionId = policiesMatch[1]!;

    if (request.req.method === "GET") {
      const connection = ctx.storeConnections.findById(storeConnectionId);
      if (!connection) {
        sendError(request.res, 404, "store connection not found");
        return true;
      }
      sendJson(request.res, 200, {
        policies: ctx.productFieldPolicies
          .listGlobal(storeConnectionId)
          .map((policy) => ({
            id: policy.id,
            field_key: policy.fieldKey,
            source: policy.source,
          })),
      });
      return true;
    }

    if (request.req.method === "PATCH") {
      const connection = ctx.storeConnections.findById(storeConnectionId);
      if (!connection) {
        sendError(request.res, 404, "store connection not found");
        return true;
      }

      const body = await readJsonBody<Record<string, unknown>>(request.req);
      const updated = [];

      for (const [fieldKey, value] of Object.entries(body)) {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          continue;
        }
        const source = (value as { source?: unknown }).source;
        if (source !== "iris" && source !== "store" && source !== "disabled") {
          continue;
        }
        updated.push(
          ctx.productFieldPolicies.upsert({
            scope: "global",
            storeConnectionId,
            fieldKey: fieldKey as never,
            source,
          }),
        );
      }

      sendJson(request.res, 200, {
        policies: updated.map((policy) => ({
          id: policy.id,
          field_key: policy.fieldKey,
          source: policy.source,
        })),
      });
      return true;
    }
  }

  return false;
}
