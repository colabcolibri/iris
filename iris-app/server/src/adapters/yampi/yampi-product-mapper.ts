import type { ExternalProduct } from "../../domain/stores/store-types.ts";

type YampiNestedList<T> = { data?: T[] } | T[] | null | undefined;

function readNestedList<T>(value: YampiNestedList<T>): T[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return value.data ?? [];
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatPrice(value: number | null): string | null {
  if (value === null) {
    return null;
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function readTexts(record: Record<string, unknown>): {
  shortDescription: string;
  longDescription: string;
} {
  const texts = record.texts;
  if (!texts || typeof texts !== "object" || Array.isArray(texts)) {
    return { shortDescription: "", longDescription: "" };
  }

  const textsRecord = texts as Record<string, unknown>;
  const nested = textsRecord.data;
  const source =
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : textsRecord;

  return {
    shortDescription:
      readString(source.short_description) ||
      readString(source.shortDescription) ||
      readString(source.summary),
    longDescription:
      readString(source.description) ||
      readString(source.long_description) ||
      readString(source.longDescription),
  };
}

function readSkuAndPrice(record: Record<string, unknown>): {
  sku: string | null;
  price: string | null;
} {
  const skus = readNestedList(record.skus as YampiNestedList<Record<string, unknown>>);
  const first = skus[0];
  if (!first) {
    return { sku: null, price: null };
  }

  const sku = readString(first.sku) || readString(first.code) || null;
  const priceValue =
    readNumber(first.price_sale) ??
    readNumber(first.price_discount) ??
    readNumber(first.price) ??
    readNumber(first.sale_price);

  return { sku, price: formatPrice(priceValue) };
}

function readImageUrl(record: Record<string, unknown>): string | null {
  const images = readNestedList(record.images as YampiNestedList<Record<string, unknown>>);
  const first = images[0];
  if (!first) {
    return null;
  }
  return readString(first.url) || readString(first.thumb_url) || null;
}

function readProductUrl(record: Record<string, unknown>): string | null {
  return (
    readString(record.url) ||
    readString(record.public_url) ||
    readString(record.link) ||
    null
  );
}

export function mapYampiProduct(raw: unknown): ExternalProduct | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const externalId = String(record.id ?? "").trim();
  const name = readString(record.name);
  if (!externalId || !name) {
    return null;
  }

  const texts = readTexts(record);
  const { sku, price } = readSkuAndPrice(record);

  return {
    externalId,
    name,
    shortDescription: texts.shortDescription,
    longDescription: texts.longDescription,
    price,
    url: readProductUrl(record),
    imageUrl: readImageUrl(record),
    sku,
    raw: record,
  };
}

export function mapYampiProductPage(
  response: { data?: unknown[]; meta?: { pagination?: { current_page?: number; per_page?: number; total_pages?: number } } },
  requestedPerPage: number,
): {
  items: ExternalProduct[];
  page: number;
  perPage: number;
  hasMore: boolean;
} {
  const items = (response.data ?? [])
    .map((entry) => mapYampiProduct(entry))
    .filter((entry): entry is ExternalProduct => entry !== null);

  const pagination = response.meta?.pagination;
  const page = pagination?.current_page ?? 1;
  const perPage = pagination?.per_page ?? requestedPerPage;
  const totalPages = pagination?.total_pages ?? page;
  const hasMore = page < totalPages;

  return { items, page, perPage, hasMore };
}
