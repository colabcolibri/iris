import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Application user guide lives in iris-app/docs/ (inicio + uso).
 * Meridian product docs stay at repo root docs/ (00_scope, architecture, …).
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
  const appDocs = path.join(irisAppRoot, "docs");

  if (fs.existsSync(path.join(appDocs, "inicio"))) {
    return appDocs;
  }

  throw new Error(
    `Could not find iris-app/docs/inicio. Set IRIS_DOCS_ROOT or run from iris-app workspace. Tried: ${appDocs}`,
  );
}

export function resolveDocsRootFromImportMeta(importMetaUrl) {
  const scriptDir = path.dirname(fileURLToPath(importMetaUrl));
  return resolveDocsRoot(scriptDir);
}
