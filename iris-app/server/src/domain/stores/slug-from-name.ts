export function slugFromName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return base || "produto";
}

export function dedupeSlug(base: string, exists: (slug: string) => boolean): string {
  if (!exists(base)) {
    return base;
  }

  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}-${index}`;
    if (!exists(candidate)) {
      return candidate;
    }
  }

  throw new Error(`unable to dedupe slug for ${base}`);
}
