import type { DatabaseSync } from "node:sqlite";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { AuthConfig } from "./auth.ts";
import { createSqliteAssetRepository } from "../adapters/sqlite/asset-repository.ts";
import { createSqlitePostRepository } from "../adapters/sqlite/post-repository.ts";
import { createSharpImageOptimizer } from "../adapters/image-optimizer/sharp-optimizer.ts";
import { createFsMediaStorage } from "../adapters/media-storage/fs-media-storage.ts";
import type { AssetRepository } from "../ports/asset-repository.ts";
import type { ImageOptimizer } from "../ports/image-optimizer.ts";
import type { MediaStorage } from "../ports/media-storage.ts";
import type { PostRepository } from "../ports/post-repository.ts";

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

export type AppContext = {
  db: DatabaseSync;
  auth: AuthConfig;
  posts: PostRepository;
  assets: AssetRepository;
  mediaStorage: MediaStorage;
  imageOptimizer: ImageOptimizer;
};

export type AppContextOptions = {
  db: DatabaseSync;
  adminToken?: string;
  agentToken?: string;
  mediaRoot?: string;
};

export function createAppContext(options: AppContextOptions): AppContext {
  const auth: AuthConfig = {
    adminToken: options.adminToken ?? process.env.IRIS_ADMIN_TOKEN ?? "",
    agentToken: options.agentToken ?? process.env.IRIS_AGENT_TOKEN ?? "",
  };

  const mediaRoot = options.mediaRoot ?? join(APP_ROOT, "data/media");

  return {
    db: options.db,
    auth,
    posts: createSqlitePostRepository(options.db),
    assets: createSqliteAssetRepository(options.db),
    mediaStorage: createFsMediaStorage(mediaRoot),
    imageOptimizer: createSharpImageOptimizer(),
  };
}
