#!/usr/bin/env node
/**
 * Post-build: correct /docs entry redirects and remove stale Astro redirect stubs.
 * Astro redirects with base "/docs" emit absolute paths without the base (e.g. /inicio/)
 * which send users to the Iris SPA home instead of the docs.
 */
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../public/docs");

function writeRedirect(file, target) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    `<!doctype html><title>Redirecting</title><meta http-equiv="refresh" content="0;url=${target}"><link rel="canonical" href="${target}"><body><a href="${target}">Continue</a></body>\n`,
  );
}

writeRedirect(join(root, "index.html"), "/docs/inicio/");
writeRedirect(join(root, "en/index.html"), "/docs/en/inicio/");

for (const rel of ["meta", "en/meta"]) {
  const dir = join(root, rel);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
    console.log(`Removed stale ${rel}/`);
  }
}

// duplicate from old sync
for (const rel of [
  "configuracao/referencia-tecnica",
  "en/configuracao/referencia-tecnica",
]) {
  const dir = join(root, rel);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
    console.log(`Removed duplicate ${rel}/`);
  }
}

console.log("Docs entry redirects fixed.");
