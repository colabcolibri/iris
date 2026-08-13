import { readJsonBody, sendError, sendJson, ValidationError } from "../json.ts";
import { guardAdmin } from "../route-guards.ts";
import type { RouteRequest } from "../route-types.ts";
import { isProductFieldKey } from "../../domain/products/product-field-keys.ts";
import { resolveProductFields } from "../../domain/products/product-field-resolver.ts";

export async function handleProductStoreRoute(request: RouteRequest): Promise<boolean> {
  const url = new URL(request.req.url ?? "/", "http://localhost");
  const pathname = url.pathname;

  const storeLinksMatch = pathname.match(/^\/api\/products\/([^/]+)\/store-links$/);
  if (storeLinksMatch) {
    const productId = storeLinksMatch[1]!;
    const match = { ...request, pathname, searchParams: url.searchParams, params: {} };
    if (!guardAdmin(match)) {
      return true;
    }

    const product = request.ctx.products.findById(productId);
    if (!product) {
      sendError(request.res, 404, "product not found");
      return true;
    }

    if (request.req.method === "GET") {
      const links = request.ctx.productStoreLinks.listByProduct(productId).map((link) => ({
        id: link.id,
        store_connection_id: link.storeConnectionId,
        external_product_id: link.externalProductId,
        external_sku: link.externalSku,
        snapshot: link.snapshot,
        linked_at: link.linkedAt,
        updated_at: link.updatedAt,
      }));

      sendJson(request.res, 200, { links });
      return true;
    }

    if (request.req.method === "POST") {
      const body = await readJsonBody<Record<string, unknown>>(request.req);
      const storeConnectionId =
        typeof body.store_connection_id === "string" ? body.store_connection_id.trim() : "";
      const externalProductId =
        typeof body.external_product_id === "string" ? body.external_product_id.trim() : "";

      if (!storeConnectionId || !externalProductId) {
        sendError(request.res, 400, "store_connection_id and external_product_id are required");
        return true;
      }

      const connection = request.ctx.storeConnections.findById(storeConnectionId);
      if (!connection) {
        sendError(request.res, 404, "store connection not found");
        return true;
      }

      const credentials = request.ctx.storeConnections.getCredentials(storeConnectionId);
      if (!credentials) {
        sendError(request.res, 400, "store connection has no credentials");
        return true;
      }

      const provider = request.ctx.storeProviders.get(connection.providerType);
      const external = await provider.getExternalProduct(credentials, externalProductId);
      if (!external) {
        sendError(request.res, 404, "external product not found");
        return true;
      }

      const link = request.ctx.productStoreLinks.upsert({
        productId,
        storeConnectionId,
        externalProductId,
        externalSku: external.sku,
        snapshot: external,
      });

      sendJson(request.res, 201, {
        id: link.id,
        store_connection_id: link.storeConnectionId,
        external_product_id: link.externalProductId,
        external_sku: link.externalSku,
        snapshot: link.snapshot,
      });
      return true;
    }
  }

  const deleteLinkMatch = pathname.match(/^\/api\/products\/([^/]+)\/store-links\/([^/]+)$/);
  if (deleteLinkMatch && request.req.method === "DELETE") {
    const productId = deleteLinkMatch[1]!;
    const linkId = deleteLinkMatch[2]!;
    const match = { ...request, pathname, searchParams: url.searchParams, params: {} };
    if (!guardAdmin(match)) {
      return true;
    }

    const link = request.ctx.productStoreLinks.findById(linkId);
    if (!link || link.productId !== productId) {
      sendError(request.res, 404, "store link not found");
      return true;
    }

    request.ctx.productStoreLinks.remove(linkId);
    sendJson(request.res, 200, { ok: true });
    return true;
  }

  const fieldPoliciesMatch = pathname.match(/^\/api\/products\/([^/]+)\/field-policies$/);
  if (fieldPoliciesMatch) {
    const productId = fieldPoliciesMatch[1]!;
    const match = { ...request, pathname, searchParams: url.searchParams, params: {} };
    if (!guardAdmin(match)) {
      return true;
    }

    const product = request.ctx.products.findById(productId);
    if (!product) {
      sendError(request.res, 404, "product not found");
      return true;
    }

    if (request.req.method === "GET") {
      const storeConnectionId = url.searchParams.get("store_connection_id")?.trim() ?? "";
      if (!storeConnectionId) {
        sendError(request.res, 400, "store_connection_id query param is required");
        return true;
      }

      const globalPolicies = request.ctx.productFieldPolicies.listGlobal(storeConnectionId);
      const productPolicies = request.ctx.productFieldPolicies.listForProduct(
        storeConnectionId,
        productId,
      );
      const link = request.ctx.productStoreLinks
        .listByProduct(productId)
        .find((entry) => entry.storeConnectionId === storeConnectionId);

      const resolved = resolveProductFields({
        product,
        snapshot: link?.snapshot ?? null,
        globalPolicies,
        productPolicies,
      });

      sendJson(request.res, 200, {
        global_policies: globalPolicies.map((policy) => ({
          field_key: policy.fieldKey,
          source: policy.source,
        })),
        product_policies: productPolicies.map((policy) => ({
          field_key: policy.fieldKey,
          source: policy.source,
        })),
        resolved_preview: resolved,
      });
      return true;
    }

    if (request.req.method === "PATCH") {
      const body = await readJsonBody<Record<string, unknown>>(request.req);
      const storeConnectionId =
        typeof body.store_connection_id === "string" ? body.store_connection_id.trim() : "";
      if (!storeConnectionId) {
        throw new ValidationError("store_connection_id is required");
      }

      const policies = body.policies;
      if (!policies || typeof policies !== "object" || Array.isArray(policies)) {
        throw new ValidationError("policies object is required");
      }

      const updated = [];
      for (const [fieldKey, value] of Object.entries(policies)) {
        if (!isProductFieldKey(fieldKey)) {
          continue;
        }
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          continue;
        }
        const source = (value as { source?: unknown }).source;
        if (source === "inherit") {
          const existingPolicy = request.ctx.productFieldPolicies
            .listForProduct(storeConnectionId, productId)
            .find((policy) => policy.fieldKey === fieldKey);
          if (existingPolicy) {
            request.ctx.productFieldPolicies.remove(existingPolicy.id);
          }
          continue;
        }
        if (source !== "iris" && source !== "store" && source !== "disabled") {
          continue;
        }
        updated.push(
          request.ctx.productFieldPolicies.upsert({
            scope: "product",
            storeConnectionId,
            productId,
            fieldKey,
            source,
          }),
        );
      }

      sendJson(request.res, 200, {
        policies: updated.map((policy) => ({
          field_key: policy.fieldKey,
          source: policy.source,
        })),
      });
      return true;
    }
  }

  return false;
}
