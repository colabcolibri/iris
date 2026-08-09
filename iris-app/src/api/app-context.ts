import type { DatabaseSync } from "node:sqlite";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { AuthConfig } from "./auth.ts";
import { createSqliteAssetRepository } from "../adapters/sqlite/asset-repository.ts";
import { createSqlitePostRepository } from "../adapters/sqlite/post-repository.ts";
import {
  bootstrapMetaTokenFromEnv,
  createSqliteMetaTokenStore,
} from "../adapters/sqlite/meta-token-repository.ts";
import { createSharpImageOptimizer } from "../adapters/image-optimizer/sharp-optimizer.ts";
import { createFsMediaStorage } from "../adapters/media-storage/fs-media-storage.ts";
import { createGraphApiPublisher } from "../adapters/meta/graph-api-publisher.ts";
import type { AssetRepository } from "../ports/asset-repository.ts";
import type { ImageOptimizer } from "../ports/image-optimizer.ts";
import type { MediaStorage } from "../ports/media-storage.ts";
import type { MetaPublisher } from "../ports/meta-publisher.ts";
import type { MetaTokenStore } from "../ports/meta-token-store.ts";
import type { PostRepository } from "../ports/post-repository.ts";

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

export type AppContext = {
  db: DatabaseSync;
  auth: AuthConfig;
  posts: PostRepository;
  assets: AssetRepository;
  mediaStorage: MediaStorage;
  imageOptimizer: ImageOptimizer;
  metaTokenStore: MetaTokenStore;
  metaPublisher: MetaPublisher | null;
  publishUrlSecret: string | null;
};

export type AppContextOptions = {
  db: DatabaseSync;
  adminToken?: string;
  agentToken?: string;
  mediaRoot?: string;
  encryptionKey?: string;
  metaAccessToken?: string;
  igUserId?: string;
  publicBaseUrl?: string;
  publishUrlSecret?: string;
  graphApiVersion?: string;
};

export function createAppContext(options: AppContextOptions): AppContext {
  const auth: AuthConfig = {
    adminToken: options.adminToken ?? process.env.IRIS_ADMIN_TOKEN ?? "",
    agentToken: options.agentToken ?? process.env.IRIS_AGENT_TOKEN ?? "",
  };

  const mediaRoot = options.mediaRoot ?? join(APP_ROOT, "data/media");
  const metaTokenStore = createSqliteMetaTokenStore(options.db, {
    encryptionKey: options.encryptionKey ?? process.env.IRIS_TOKEN_ENCRYPTION_KEY,
  });

  bootstrapMetaTokenFromEnv(
    metaTokenStore,
    options.metaAccessToken ?? process.env.META_ACCESS_TOKEN,
  );

  const publicBaseUrl =
    options.publicBaseUrl ?? process.env.IRIS_PUBLIC_BASE_URL ?? "";
  const publishUrlSecret =
    options.publishUrlSecret ?? process.env.IRIS_PUBLISH_URL_SECRET ?? "";
  const igUserId = options.igUserId ?? process.env.META_IG_USER_ID ?? "";

  const assets = createSqliteAssetRepository(options.db);

  const metaPublisher =
    igUserId && publicBaseUrl && publishUrlSecret
      ? createGraphApiPublisher({
          metaTokenStore,
          assets,
          config: {
            igUserId,
            publicBaseUrl,
            publishUrlSecret,
            graphApiVersion: options.graphApiVersion ?? process.env.META_GRAPH_API_VERSION,
          },
        })
      : null;

  return {
    db: options.db,
    auth,
    posts: createSqlitePostRepository(options.db),
    assets,
    mediaStorage: createFsMediaStorage(mediaRoot),
    imageOptimizer: createSharpImageOptimizer(),
    metaTokenStore,
    metaPublisher,
    publishUrlSecret: publishUrlSecret || null,
  };
}
