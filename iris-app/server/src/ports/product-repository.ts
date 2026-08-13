import type { Product } from "../../domain/products/product.ts";

export type CreateProductInput = {
  slug: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  active?: boolean;
  sortOrder?: number;
};

export type UpdateProductInput = {
  slug?: string;
  name?: string;
  shortDescription?: string;
  longDescription?: string;
  active?: boolean;
  sortOrder?: number;
};

export type ProductRepository = {
  list(activeOnly?: boolean): Product[];
  findById(id: string): Product | null;
  findBySlug(slug: string): Product | null;
  create(input: CreateProductInput): Product;
  update(id: string, input: UpdateProductInput): Product | null;
  deactivate(id: string): boolean;
};
