import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../../api/app-context.ts";
import { ValidationError } from "../../api/json.ts";
import { resolveProductFields } from "../../domain/products/product-field-resolver.ts";
import { isProductFieldKey } from "../../domain/products/product-field-keys.ts";
import { serializeStoreConnection } from "../../domain/stores/serialize-store-connection.ts";
import { jsonToolContent, toolError } from "../tool-response.ts";

function readYampiCreateBody(args: Record<string, unknown>) {
  const label = typeof args.label === "string" ? args.label.trim() : "";
  const alias = typeof args.alias === "string" ? args.alias.trim() : "";
  const userToken =
    typeof args.user_token === "string"
      ? args.user_token.trim()
      : typeof args.userToken === "string"
        ? args.userToken.trim()
        : "";
  const userSecretKey =
    typeof args.user_secret_key === "string"
      ? args.user_secret_key.trim()
      : typeof args.userSecretKey === "string"
        ? args.userSecretKey.trim()
        : "";

  if (!label || !alias || !userToken || !userSecretKey) {
    throw new ValidationError("label, alias, user_token and user_secret_key are required");
  }

  return {
    providerType: "yampi" as const,
    label,
    credentials: {
      providerType: "yampi" as const,
      yampi: { alias, userToken, userSecretKey },
    },
  };
}

export function registerStoreTools(server: McpServer, ctx: AppContext): void {
  server.tool(
    "iris_list_store_connections",
    "List store connections (Yampi, etc.) without secrets",
    {},
    async () => {
      const store_connections = ctx.storeConnections.list().map(serializeStoreConnection);
      return jsonToolContent({ store_connections });
    },
  );

  server.tool(
    "iris_create_store_connection",
    "Create a Yampi store connection (v1.19)",
    {
      label: z.string().min(1),
      alias: z.string().min(1),
      user_token: z.string().min(1),
      user_secret_key: z.string().min(1),
      provider_type: z.enum(["yampi"]).optional().default("yampi"),
    },
    async (args) => {
      try {
        if (args.provider_type !== "yampi") {
          return toolError("only yampi is supported in v1.19");
        }
        const body = readYampiCreateBody(args);
        const created = ctx.storeConnections.create({
          providerType: body.providerType,
          label: body.label,
          credentials: body.credentials,
          settings: {},
        });
        return jsonToolContent({ store_connection: serializeStoreConnection(created) });
      } catch (error) {
        return toolError(error instanceof Error ? error.message : "create failed");
      }
    },
  );

  server.tool(
    "iris_delete_store_connection",
    "Delete a store connection by id",
    {
      store_connection_id: z.string().min(1),
    },
    async (args) => {
      const ok = ctx.storeConnections.remove(args.store_connection_id);
      if (!ok) {
        return toolError("store connection not found");
      }
      return jsonToolContent({ ok: true });
    },
  );

  server.tool(
    "iris_test_store_connection",
    "Test store connection credentials",
    {
      store_connection_id: z.string().min(1),
    },
    async (args) => {
      const connection = ctx.storeConnections.findById(args.store_connection_id);
      if (!connection) {
        return toolError("store connection not found");
      }

      const credentials = ctx.storeConnections.getCredentials(args.store_connection_id);
      if (!credentials) {
        return toolError("store connection has no credentials");
      }

      try {
        const provider = ctx.storeProviders.get(connection.providerType);
        const result = await provider.testConnection(credentials);
        ctx.storeConnections.update(args.store_connection_id, {
          status: result.ok ? "active" : "error",
          lastError: result.ok ? null : result.message,
        });
        return jsonToolContent(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : "test failed";
        ctx.storeConnections.update(args.store_connection_id, {
          status: "error",
          lastError: message,
        });
        return toolError(message);
      }
    },
  );

  server.tool(
    "iris_sync_store_catalog",
    "Sync catalog from a store connection into Iris",
    {
      store_connection_id: z.string().min(1),
      import_new: z.boolean().optional(),
    },
    async (args) => {
      try {
        const result = await ctx.storeCatalogSync.syncStoreConnection(args.store_connection_id, {
          importNew: args.import_new === true,
        });
        return jsonToolContent(result);
      } catch (error) {
        return toolError(error instanceof Error ? error.message : "sync failed");
      }
    },
  );

  server.tool(
    "iris_get_product_field_policies",
    "Get global/product field policies and resolved preview for a product",
    {
      product_id: z.string().min(1),
      store_connection_id: z.string().min(1),
    },
    async (args) => {
      const product = ctx.products.findById(args.product_id);
      if (!product) {
        return toolError("product not found");
      }

      const connection = ctx.storeConnections.findById(args.store_connection_id);
      if (!connection) {
        return toolError("store connection not found");
      }

      const globalPolicies = ctx.productFieldPolicies.listGlobal(args.store_connection_id);
      const productPolicies = ctx.productFieldPolicies.listForProduct(
        args.store_connection_id,
        args.product_id,
      );
      const link = ctx.productStoreLinks
        .listByProduct(args.product_id)
        .find((entry) => entry.storeConnectionId === args.store_connection_id);

      const resolved_preview = resolveProductFields({
        product,
        snapshot: link?.snapshot ?? null,
        globalPolicies,
        productPolicies,
      });

      return jsonToolContent({
        global_policies: globalPolicies.map((policy) => ({
          field_key: policy.fieldKey,
          source: policy.source,
        })),
        product_policies: productPolicies.map((policy) => ({
          field_key: policy.fieldKey,
          source: policy.source,
        })),
        resolved_preview,
      });
    },
  );

  server.tool(
    "iris_update_product_field_policies",
    "Update per-product field policy overrides",
    {
      product_id: z.string().min(1),
      store_connection_id: z.string().min(1),
      policies: z.record(
        z.string(),
        z.object({
          source: z.enum(["iris", "store", "disabled", "inherit"]),
        }),
      ),
    },
    async (args) => {
      const product = ctx.products.findById(args.product_id);
      if (!product) {
        return toolError("product not found");
      }

      const connection = ctx.storeConnections.findById(args.store_connection_id);
      if (!connection) {
        return toolError("store connection not found");
      }

      const updated = [];
      for (const [fieldKey, value] of Object.entries(args.policies)) {
        if (!isProductFieldKey(fieldKey)) {
          continue;
        }

        if (value.source === "inherit") {
          const existingPolicy = ctx.productFieldPolicies
            .listForProduct(args.store_connection_id, args.product_id)
            .find((policy) => policy.fieldKey === fieldKey);
          if (existingPolicy) {
            ctx.productFieldPolicies.remove(existingPolicy.id);
          }
          continue;
        }

        updated.push(
          ctx.productFieldPolicies.upsert({
            scope: "product",
            storeConnectionId: args.store_connection_id,
            productId: args.product_id,
            fieldKey,
            source: value.source,
          }),
        );
      }

      return jsonToolContent({
        policies: updated.map((policy) => ({
          field_key: policy.fieldKey,
          source: policy.source,
        })),
      });
    },
  );
}
