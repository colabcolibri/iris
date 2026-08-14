import type { ProductFieldPolicyRepository } from "../../ports/product-field-policy-repository.ts";
import type { ProductRepository } from "../../ports/product-repository.ts";
import type { ProductStoreLinkRepository } from "../../ports/product-store-link-repository.ts";
import type { Product } from "./product.ts";
import { resolveProductView } from "../harness/resolve-product-view.ts";
import type { ResolvedProductView } from "./resolved-product-view.ts";

export type ProductCatalogSearchDeps = {
  products: ProductRepository;
  productStoreLinks: ProductStoreLinkRepository;
  productFieldPolicies: ProductFieldPolicyRepository;
};

export type ProductCatalogSearchResult = {
  items: ResolvedProductView[];
  query: string;
  totalMatched: number;
  suggestions: Array<{ slug: string; name: string; score: number }>;
};

const PT_STOPWORDS = new Set([
  "a",
  "o",
  "as",
  "os",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "na",
  "no",
  "nas",
  "nos",
  "um",
  "uma",
  "pra",
  "para",
  "com",
  "sem",
  "que",
  "me",
  "eu",
]);

export function foldProductSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeQuery(query: string): string[] {
  const folded = foldProductSearchText(query);
  if (!folded) {
    return [];
  }
  return folded
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !PT_STOPWORDS.has(token));
}

type ScoredProduct = {
  product: Product;
  score: number;
};

function scoreProduct(product: Product, tokens: string[]): number {
  if (tokens.length === 0) {
    return 0;
  }

  const name = foldProductSearchText(product.name);
  const slug = foldProductSearchText(product.slug.replace(/-/g, " "));
  const shortDesc = foldProductSearchText(product.shortDescription);
  const longDesc = foldProductSearchText(product.longDescription);

  let score = 0;
  const phrase = tokens.join(" ");

  if (name.includes(phrase) || slug.includes(phrase)) {
    score += 10;
  }

  for (const token of tokens) {
    if (name.includes(token)) {
      score += 3;
    }
    if (slug.includes(token)) {
      score += 2;
    }
    if (shortDesc.includes(token)) {
      score += 1;
    }
    if (longDesc.includes(token)) {
      score += 0.5;
    }
  }

  return score;
}

const MATCH_THRESHOLD = 1;

export function searchProductCatalog(
  deps: ProductCatalogSearchDeps,
  query: string,
  options: { limit?: number; activeOnly?: boolean } = {},
): ProductCatalogSearchResult {
  const limit = options.limit ?? 10;
  const activeOnly = options.activeOnly !== false;
  const normalizedQuery = query.trim();
  const tokens = tokenizeQuery(normalizedQuery);
  const catalog = deps.products.list(activeOnly);

  const scored: ScoredProduct[] = catalog
    .map((product) => ({
      product,
      score: scoreProduct(product, tokens),
    }))
    .filter((entry) => (tokens.length === 0 ? true : entry.score > 0))
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));

  const matched = scored.filter((entry) => entry.score >= MATCH_THRESHOLD).slice(0, limit);
  const suggestionSource =
    matched.length > 0
      ? scored
      : catalog.map((product) => ({ product, score: 0 }));
  const suggestions = suggestionSource.slice(0, 3).map((entry) => ({
    slug: entry.product.slug,
    name: entry.product.name,
    score: entry.score,
  }));

  const items = matched
    .map((entry) => resolveProductView(deps, entry.product.id))
    .filter((view): view is ResolvedProductView => view !== null);

  return {
    items,
    query: normalizedQuery,
    totalMatched: matched.length,
    suggestions,
  };
}
