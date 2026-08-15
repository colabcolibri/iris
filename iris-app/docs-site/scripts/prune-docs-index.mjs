#!/usr/bin/env node
/** Remove Astro redirect stubs that point to /meta/ (site root) instead of /docs/meta/. */
import { existsSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../public/docs");
for (const rel of ["index.html", "en/index.html"]) {
  const file = join(root, rel);
  if (existsSync(file)) unlinkSync(file);
}
