import type { DatabaseSync } from "node:sqlite";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { AuthConfig } from "./auth.ts";
import { createSqliteAssetRepository } from "../adapters/sqlite/asset-repository.ts";
import { createSqliteCommentRepository } from "../adapters/sqlite/comment-repository.ts";
import { createSqlitePostRepository } from "../adapters/sqlite/post-repository.ts";
import {
  bootstrapMetaTokenFromEnv,
  createSqliteMetaTokenStore,
} from "../adapters/sqlite/meta-token-repository.ts";
import { createSharpImageOptimizer } from "../adapters/image-optimizer/sharp-optimizer.ts";
import { createFsMediaStorage } from "../adapters/media-storage/fs-media-storage.ts";
import { createGraphApiPublisher } from "../adapters/meta/graph-api-publisher.ts";
import { createGraphApiCommentReplier } from "../adapters/meta/graph-api-comment-replier.ts";
import { createSqliteAgentRunRepository } from "../adapters/sqlite/agent-run-repository.ts";
import { createEnvLlmCompleter } from "../adapters/llm/env-llm-completer.ts";
import { createEmailSenderFromEnv } from "../adapters/email/create-email-sender.ts";
import { createSqliteAdminLoginChallengeRepository } from "../adapters/sqlite/admin-login-challenge-repository.ts";
import type { AdminLoginChallengeRepository } from "../adapters/sqlite/admin-login-challenge-repository.ts";
import type { EmailSender } from "../ports/email-sender.ts";
import type { AgentRunRepository } from "../ports/agent-run-repository.ts";
import type { LlmCompleter } from "../ports/llm-completer.ts";
import type { AssetRepository } from "../ports/asset-repository.ts";
import type { CommentRepository } from "../ports/comment-repository.ts";
import type { ImageOptimizer } from "../ports/image-optimizer.ts";
import type { MediaStorage } from "../ports/media-storage.ts";
import type { MetaCommentReplier } from "../ports/meta-comment-replier.ts";
import type { MetaPublisher } from "../ports/meta-publisher.ts";
import type { MetaTokenStore } from "../ports/meta-token-store.ts";
import type { PostRepository } from "../ports/post-repository.ts";

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

export type AppContext = {
  db: DatabaseSync;
  auth: AuthConfig;
  posts: PostRepository;
  assets: AssetRepository;
  comments: CommentRepository;
  mediaStorage: MediaStorage;
  imageOptimizer: ImageOptimizer;
  metaTokenStore: MetaTokenStore;
  metaPublisher: MetaPublisher | null;
  metaCommentReplier: MetaCommentReplier | null;
  agentRuns: AgentRunRepository;
  llmCompleter: LlmCompleter | null;
  publishUrlSecret: string | null;
  metaAppSecret: string | null;
  metaWebhookVerifyToken: string | null;
  emailSender: EmailSender;
  adminLoginChallenges: AdminLoginChallengeRepository;
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
  metaAppSecret?: string;
  metaWebhookVerifyToken?: string;
  emailSender?: EmailSender;
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
  const graphApiVersion =
    options.graphApiVersion ?? process.env.META_GRAPH_API_VERSION;

  const assets = createSqliteAssetRepository(options.db);
  const metaAppSecret = options.metaAppSecret ?? process.env.META_APP_SECRET ?? "";
  const metaWebhookVerifyToken =
    options.metaWebhookVerifyToken ?? process.env.META_WEBHOOK_VERIFY_TOKEN ?? "";

  const metaPublisher =
    igUserId && publicBaseUrl && publishUrlSecret
      ? createGraphApiPublisher({
          metaTokenStore,
          assets,
          config: {
            igUserId,
            publicBaseUrl,
            publishUrlSecret,
            graphApiVersion,
          },
        })
      : null;

  const metaCommentReplier = metaTokenStore.getActiveToken()
    ? createGraphApiCommentReplier({
        metaTokenStore,
        config: { graphApiVersion },
      })
    : null;

  const llmApiKey = process.env.LLM_API_KEY ?? "";
  const llmCompleter = llmApiKey ? createEnvLlmCompleter() : null;
  const emailSender = options.emailSender ?? createEmailSenderFromEnv();
  const adminLoginChallenges = createSqliteAdminLoginChallengeRepository(options.db);

  return {
    db: options.db,
    auth,
    posts: createSqlitePostRepository(options.db),
    assets,
    comments: createSqliteCommentRepository(options.db),
    mediaStorage: createFsMediaStorage(mediaRoot),
    imageOptimizer: createSharpImageOptimizer(),
    metaTokenStore,
    metaPublisher,
    metaCommentReplier,
    agentRuns: createSqliteAgentRunRepository(options.db),
    llmCompleter,
    publishUrlSecret: publishUrlSecret || null,
    metaAppSecret: metaAppSecret || null,
    metaWebhookVerifyToken: metaWebhookVerifyToken || null,
    emailSender,
    adminLoginChallenges,
  };
}
