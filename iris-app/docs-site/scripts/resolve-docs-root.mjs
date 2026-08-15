import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Monorepo docs live at <repo>/docs while builds run from iris-app/.
 * Docker (repo-root Dockerfile): COPY docs ../docs → /docs when WORKDIR is /app.
 */
export function resolveDocsRoot(scriptDir) {
  const fromEnv = process.env.IRIS_DOCS_ROOT?.trim();
  if (fromEnv) {
    if (!fs.existsSync(fromEnv)) {
      throw new Error(`IRIS_DOCS_ROOT does not exist: ${fromEnv}`);
    }
    return fromEnv;
  }

  const irisAppRoot = path.resolve(scriptDir, "../../");
  const candidates = [
    path.join(irisAppRoot, "..", "docs"),
    path.join(irisAppRoot, "docs"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "inicio"))) {
      return candidate;
    }
  }

  throw new Error(
    `Could not find docs/inicio. Run from monorepo root Dockerfile (COPY docs ../docs) or set IRIS_DOCS_ROOT. Tried: ${candidates.join(", ")}`,
  );
}

export function resolveDocsRootFromImportMeta(importMetaUrl) {
  const scriptDir = path.dirname(fileURLToPath(importMetaUrl));
  return resolveDocsRoot(scriptDir);
}
