import { readJsonBody, sendError, sendJson, ValidationError } from "../json.ts";
import { guardAdmin } from "../route-guards.ts";
import type { RouteRequest } from "../route-types.ts";
import { serializeProduct } from "../../domain/products/serialize-product.ts";

function readSlug(body: Record<string, unknown>): string {
  if (typeof body.slug !== "string" || !body.slug.trim()) {
    throw new ValidationError("slug is required");
  }
  return body.slug.trim();
}

function readName(body: Record<string, unknown>): string {
  if (typeof body.name !== "string" || !body.name.trim()) {
    throw new ValidationError("name is required");
  }
  return body.name.trim();
}

export async function handleProductsRoute(request: RouteRequest): Promise<boolean> {
  const url = new URL(request.req.url ?? "/", "http://localhost");
  const pathname = url.pathname;
  if (!pathname.startsWith("/api/products")) {
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

  if (pathname === "/api/products" && request.req.method === "GET") {
    const activeOnly = url.searchParams.get("active") === "true";
    const products = request.ctx.products.list(activeOnly).map(serializeProduct);
    sendJson(request.res, 200, { products });
    return true;
  }

  if (pathname === "/api/products" && request.req.method === "POST") {
    const body = await readJsonBody<Record<string, unknown>>(request.req);
    const slug = readSlug(body);
    if (request.ctx.products.findBySlug(slug)) {
      sendError(request.res, 409, "slug already exists");
      return true;
    }

    const created = request.ctx.products.create({
      slug,
      name: readName(body),
      shortDescription:
        typeof body.short_description === "string" ? body.short_description : "",
      longDescription:
        typeof body.long_description === "string" ? body.long_description : "",
      active: body.active !== false,
      sortOrder: typeof body.sort_order === "number" ? body.sort_order : 0,
    });
    sendJson(request.res, 201, serializeProduct(created));
    return true;
  }

  const patchMatch = pathname.match(/^\/api\/products\/([^/]+)$/);
  if (patchMatch && request.req.method === "PATCH") {
    const id = patchMatch[1]!;
    const existing = request.ctx.products.findById(id);
    if (!existing) {
      sendError(request.res, 404, "product not found");
      return true;
    }

    const body = await readJsonBody<Record<string, unknown>>(request.req);
    if ("slug" in body && typeof body.slug === "string" && body.slug.trim()) {
      const other = request.ctx.products.findBySlug(body.slug.trim());
      if (other && other.id !== id) {
        sendError(request.res, 409, "slug already exists");
        return true;
      }
    }

    const updated = request.ctx.products.update(id, {
      slug: typeof body.slug === "string" ? body.slug.trim() : undefined,
      name: typeof body.name === "string" ? body.name.trim() : undefined,
      shortDescription:
        typeof body.short_description === "string" ? body.short_description : undefined,
      longDescription:
        typeof body.long_description === "string" ? body.long_description : undefined,
      active: typeof body.active === "boolean" ? body.active : undefined,
      sortOrder: typeof body.sort_order === "number" ? body.sort_order : undefined,
    });

    if (!updated) {
      sendError(request.res, 404, "product not found");
      return true;
    }

    sendJson(request.res, 200, serializeProduct(updated));
    return true;
  }

  if (patchMatch && request.req.method === "DELETE") {
    const id = patchMatch[1]!;
    const ok = request.ctx.products.remove(id);
    if (!ok) {
      sendError(request.res, 404, "product not found");
      return true;
    }
    sendJson(request.res, 200, { ok: true });
    return true;
  }

  return false;
}
