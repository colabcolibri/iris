import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "../../api/app-context.ts";
import { ValidationError } from "../../api/json.ts";
import { serializeProduct } from "../../domain/products/serialize-product.ts";
import { jsonToolContent, toolError } from "../tool-response.ts";

function readSlug(value: string): string {
  const slug = value.trim();
  if (!slug) {
    throw new ValidationError("slug is required");
  }
  return slug;
}

function readName(value: string): string {
  const name = value.trim();
  if (!name) {
    throw new ValidationError("name is required");
  }
  return name;
}

export function registerProductTools(server: McpServer, ctx: AppContext): void {
  server.tool(
    "iris_list_products",
    "List products used by the DM message-harness for triage and reply context",
    {
      active_only: z
        .boolean()
        .optional()
        .describe("When true, returns only active products (same as GET /api/products?active=true)"),
    },
    async (args) => {
      const products = ctx.products.list(args.active_only === true).map(serializeProduct);
      return jsonToolContent({ products });
    },
  );

  server.tool(
    "iris_get_product",
    "Get a product by id",
    {
      product_id: z.string().min(1),
    },
    async (args) => {
      const product = ctx.products.findById(args.product_id);
      if (!product) {
        return toolError("product not found");
      }
      return jsonToolContent({ product: serializeProduct(product) });
    },
  );

  server.tool(
    "iris_create_product",
    "Create a product (slug must be unique)",
    {
      slug: z.string().min(1),
      name: z.string().min(1),
      short_description: z.string().optional(),
      long_description: z.string().optional(),
      active: z.boolean().optional(),
      sort_order: z.number().int().optional(),
    },
    async (args) => {
      try {
        const slug = readSlug(args.slug);
        if (ctx.products.findBySlug(slug)) {
          return toolError("slug already exists");
        }
        const created = ctx.products.create({
          slug,
          name: readName(args.name),
          shortDescription: args.short_description ?? "",
          longDescription: args.long_description ?? "",
          active: args.active !== false,
          sortOrder: args.sort_order ?? 0,
        });
        return jsonToolContent({ product: serializeProduct(created) });
      } catch (error) {
        if (error instanceof ValidationError) {
          return toolError(error.message);
        }
        return toolError(error instanceof Error ? error.message : "create failed");
      }
    },
  );

  server.tool(
    "iris_update_product",
    "Update a product by id (partial fields accepted)",
    {
      product_id: z.string().min(1),
      slug: z.string().optional(),
      name: z.string().optional(),
      short_description: z.string().optional(),
      long_description: z.string().optional(),
      active: z.boolean().optional(),
      sort_order: z.number().int().optional(),
    },
    async (args) => {
      try {
        const existing = ctx.products.findById(args.product_id);
        if (!existing) {
          return toolError("product not found");
        }

        if (args.slug !== undefined) {
          const slug = readSlug(args.slug);
          const other = ctx.products.findBySlug(slug);
          if (other && other.id !== args.product_id) {
            return toolError("slug already exists");
          }
        }

        const updated = ctx.products.update(args.product_id, {
          slug: args.slug !== undefined ? readSlug(args.slug) : undefined,
          name: args.name !== undefined ? readName(args.name) : undefined,
          shortDescription: args.short_description,
          longDescription: args.long_description,
          active: args.active,
          sortOrder: args.sort_order,
        });

        if (!updated) {
          return toolError("product not found");
        }

        return jsonToolContent({ product: serializeProduct(updated) });
      } catch (error) {
        if (error instanceof ValidationError) {
          return toolError(error.message);
        }
        return toolError(error instanceof Error ? error.message : "update failed");
      }
    },
  );

  server.tool(
    "iris_delete_product",
    "Permanently delete a product by id",
    {
      product_id: z.string().min(1),
    },
    async (args) => {
      const ok = ctx.products.remove(args.product_id);
      if (!ok) {
        return toolError("product not found");
      }
      return jsonToolContent({ ok: true });
    },
  );
}
