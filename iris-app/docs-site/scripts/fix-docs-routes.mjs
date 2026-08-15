#!/usr/bin/env node
/**
 * Post-build: write static redirect stubs from docs-routes.json (single source of truth).
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../public/docs");
const routes = JSON.parse(
  readFileSync(join(__dirname, "../docs-routes.json"), "utf8"),
);

function assertSafeTarget(target) {
  if (
    !target.startsWith(routes.allowedPrefix) ||
    target.includes("..") ||
    target.includes("//") ||
    target.includes("?") ||
    target.includes("#")
  ) {
    throw new Error(`Unsafe redirect target: ${target}`);
  }
}

function writeRedirect(file, target) {
  assertSafeTarget(target);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    `<!doctype html><title>Redirecting</title><meta http-equiv="refresh" content="0;url=${target}"><link rel="canonical" href="${target}"><body><a href="${target}">Continue</a></body>\n`,
  );
}

for (const { file, target } of routes.staticStubs) {
  writeRedirect(join(root, file), target);
}

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

console.log(`Docs static stubs: ${routes.staticStubs.length} redirects.`);
