import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** `iris-app/server` */
export const SERVER_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** `iris-app` (workspace root: server + admin + public) */
export const WORKSPACE_ROOT = join(SERVER_ROOT, "..");

export const PUBLIC_DIR = join(WORKSPACE_ROOT, "public");
export const ADMIN_DIR = join(WORKSPACE_ROOT, "admin");
export const MIGRATIONS_DIR = join(SERVER_ROOT, "migrations");
export const DATA_DIR = join(WORKSPACE_ROOT, "data");
export const MEDIA_ROOT = join(DATA_DIR, "media");
export const WORKSPACE_ENV_PATH = join(WORKSPACE_ROOT, ".env");
export const WORKSPACE_ENV_LOCAL_PATH = join(WORKSPACE_ROOT, ".env.local");
