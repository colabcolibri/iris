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
import { createSqliteMetaConnectionStore } from "../adapters/sqlite/meta-connection-repository.ts";
import { createSharpImageOptimizer } from "../adapters/image-optimizer/sharp-optimizer.ts";
import { createFsMediaStorage } from "../adapters/media-storage/fs-media-storage.ts";
import { createGraphApiPublisher } from "../adapters/meta/graph-api-publisher.ts";
import { createGraphApiCommentReplier } from "../adapters/meta/graph-api-comment-replier.ts";
import { createGraphApiCommentReader } from "../adapters/meta/graph-api-comment-reader.ts";
import { createSqliteAgentRunRepository } from "../adapters/sqlite/agent-run-repository.ts";
import { createEmailSenderFromEnv } from "../adapters/email/create-email-sender.ts";
import { createSqliteReplyPersonaStore } from "../adapters/sqlite/reply-persona-repository.ts";
import { createSqliteAppSettingsStore } from "../adapters/sqlite/app-settings-repository.ts";
import { createSqliteMcpConnectionStore } from "../adapters/sqlite/mcp-connection-repository.ts";
import { createSqliteWebhookEventRepository } from "../adapters/sqlite/webhook-event-repository.ts";
import { createSqliteLlmSettingsStore } from "../adapters/sqlite/llm-settings-repository.ts";
import { createEnvImageContextProvider } from "../adapters/llm/image-context-provider.ts";
import {
  createLlmConfigResolver,
  type LlmConfigResolver,
} from "../domain/llm/resolve-llm-config.ts";
import {
  createSqliteAdminLoginChallengeRepository,
  type AdminLoginChallengeRepository,
} from "../adapters/sqlite/admin-login-challenge-repository.ts";
import type { EmailSender } from "../ports/email-sender.ts";
import type { AgentRunRepository } from "../ports/agent-run-repository.ts";
import type { LlmCompleter } from "../ports/llm-completer.ts";
import type { AssetRepository } from "../ports/asset-repository.ts";
import type { CommentRepository } from "../ports/comment-repository.ts";
import type { ImageOptimizer } from "../ports/image-optimizer.ts";
import type { MediaStorage } from "../ports/media-storage.ts";
import type { MetaCommentReplier } from "../ports/meta-comment-replier.ts";
import type { MetaCommentReader } from "../ports/meta-comment-reader.ts";
import type { MetaConnectionStore } from "../ports/meta-connection-store.ts";
import type { MetaPublisher } from "../ports/meta-publisher.ts";
import type { MetaTokenStore } from "../ports/meta-token-store.ts";
import type { PostRepository } from "../ports/post-repository.ts";
import type { ReplyPersonaStore } from "../ports/reply-persona-store.ts";
import type { AppSettingsStore } from "../ports/app-settings-store.ts";
import type { McpConnectionStore } from "../ports/mcp-connection-store.ts";
import type { ImageContextProvider } from "../ports/image-context-provider.ts";
import type { LlmSettingsStore } from "../ports/llm-settings-store.ts";
import type { WebhookEventRepository } from "../ports/webhook-event-repository.ts";
import type { ReplyContextAssemblerDeps } from "../domain/reply-context/reply-context-assembler.ts";
import {
  loadMcpConnectionCodeFromEnv,
  type McpConfig,
} from "../domain/mcp-connection.ts";
import {
  createMcpConnectionVerifier,
  type McpConnectionVerifier,
} from "../domain/mcp-connection-verifier.ts";

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

export type AppContext = {
  db: DatabaseSync;
  auth: AuthConfig;
  mcp: McpConfig;
  mcpVerifier: McpConnectionVerifier;
  mcpConnectionStore: McpConnectionStore;
  posts: PostRepository;
  assets: AssetRepository;
  comments: CommentRepository;
  mediaStorage: MediaStorage;
  imageOptimizer: ImageOptimizer;
  metaTokenStore: MetaTokenStore;
  metaConnectionStore: MetaConnectionStore;
  metaPublisher: MetaPublisher | null;
  metaCommentReplier: MetaCommentReplier;
  metaCommentReader: MetaCommentReader;
  agentRuns: AgentRunRepository;
  llmCompleter: LlmCompleter | null;
  llmSettingsStore: LlmSettingsStore;
  llmConfigResolver: LlmConfigResolver;
  webhookEvents: WebhookEventRepository;
  resolveLlmCompleter(): LlmCompleter | null;
  publishUrlSecret: string | null;
  metaAppSecret: string | null;
  metaWebhookVerifyToken: string | null;
  publicBaseUrl: string | null;
  graphApiVersion: string;
  emailSender: EmailSender;
  adminLoginChallenges: AdminLoginChallengeRepository;
  replyPersonaStore: ReplyPersonaStore;
  appSettingsStore: AppSettingsStore;
  imageContextProvider: ImageContextProvider;
  replyContextAssembler: ReplyContextAssemblerDeps;
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
  mcpConnectionCode?: string;
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
  const metaConnectionStore = createSqliteMetaConnectionStore(options.db);

  bootstrapMetaTokenFromEnv(
    metaTokenStore,
    options.metaAccessToken ?? process.env.META_ACCESS_TOKEN,
  );

  const envIgUserId = options.igUserId ?? process.env.META_IG_USER_ID ?? "";
  if (envIgUserId && !metaConnectionStore.get()) {
    metaConnectionStore.upsert({
      igUserId: envIgUserId,
      igUsername: null,
      pageId: "env-bootstrap",
      pageName: null,
    });
  }
  const publicBaseUrl =
    options.publicBaseUrl ?? process.env.IRIS_PUBLIC_BASE_URL ?? "";
  const publishUrlSecret =
    options.publishUrlSecret ?? process.env.IRIS_PUBLISH_URL_SECRET ?? "";
  const graphApiVersion =
    options.graphApiVersion ?? process.env.META_GRAPH_API_VERSION ?? "v21.0";

  const resolveIgUserId = (): string | null => {
    const fromStore = metaConnectionStore.get()?.igUserId;
    if (fromStore) {
      return fromStore;
    }
    return envIgUserId || null;
  };

  const assets = createSqliteAssetRepository(options.db);
  const metaAppSecret = options.metaAppSecret ?? process.env.META_APP_SECRET ?? "";
  const metaWebhookVerifyToken =
    options.metaWebhookVerifyToken ?? process.env.META_WEBHOOK_VERIFY_TOKEN ?? "";

  const metaPublisher =
    publicBaseUrl && publishUrlSecret
      ? createGraphApiPublisher({
          metaTokenStore,
          assets,
          config: {
            resolveIgUserId,
            publicBaseUrl,
            publishUrlSecret,
            graphApiVersion,
          },
        })
      : null;

  const metaCommentReplier = createGraphApiCommentReplier({
    metaTokenStore,
    config: { graphApiVersion },
  });

  const metaCommentReader = createGraphApiCommentReader({
    metaTokenStore,
    config: {
      resolveIgUserId,
      graphApiVersion,
    },
  });

  const llmSettingsStore = createSqliteLlmSettingsStore(options.db, {
    encryptionKey: options.encryptionKey ?? process.env.IRIS_TOKEN_ENCRYPTION_KEY,
  });
  const llmConfigResolver = createLlmConfigResolver(llmSettingsStore);
  const llmCompleter = llmConfigResolver.createCompleter();
  const emailSender = options.emailSender ?? createEmailSenderFromEnv();
  const adminLoginChallenges = createSqliteAdminLoginChallengeRepository(options.db);
  const replyPersonaStore = createSqliteReplyPersonaStore(options.db);
  const appSettingsStore = createSqliteAppSettingsStore(options.db);
  const mcpConnectionStore = createSqliteMcpConnectionStore(options.db);
  const webhookEvents = createSqliteWebhookEventRepository(options.db);
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const envMcpCode = (
    options.mcpConnectionCode ?? process.env.IRIS_MCP_CONNECTION_CODE ?? ""
  ).trim();
  const mcpVerifier = createMcpConnectionVerifier({
    envCode: envMcpCode,
    nodeEnv,
    getStoredHash: () => mcpConnectionStore.get()?.codeHash ?? null,
  });
  const imageContextProvider = createEnvImageContextProvider({
    resolveLlm: () => llmConfigResolver.createCompleter(),
    resolveModel: () =>
      llmConfigResolver.resolve()?.model ?? process.env.LLM_MODEL ?? "gpt-4o-mini",
    resolveSupportsVision: () =>
      llmConfigResolver.resolve()?.supportsVision ?? false,
  });

  const replyContextAssembler: ReplyContextAssemblerDeps = {
    posts: createSqlitePostRepository(options.db),
    assets,
    comments: createSqliteCommentRepository(options.db),
    personaStore: replyPersonaStore,
    imageContextProvider,
    publicBaseUrl: publicBaseUrl || null,
    publishUrlSecret: publishUrlSecret || null,
  };

  return {
    db: options.db,
    auth,
    mcp: {
      connectionCode: envMcpCode || loadMcpConnectionCodeFromEnv(nodeEnv),
    },
    mcpVerifier,
    mcpConnectionStore,
    posts: replyContextAssembler.posts,
    assets,
    comments: replyContextAssembler.comments,
    mediaStorage: createFsMediaStorage(mediaRoot),
    imageOptimizer: createSharpImageOptimizer(),
    metaTokenStore,
    metaConnectionStore,
    metaPublisher,
    metaCommentReplier,
    metaCommentReader,
    agentRuns: createSqliteAgentRunRepository(options.db),
    llmCompleter,
    llmSettingsStore,
    llmConfigResolver,
    webhookEvents,
    resolveLlmCompleter: () => llmConfigResolver.createCompleter(),
    publishUrlSecret: publishUrlSecret || null,
    metaAppSecret: metaAppSecret || null,
    metaWebhookVerifyToken: metaWebhookVerifyToken || null,
    publicBaseUrl: publicBaseUrl || null,
    graphApiVersion,
    emailSender,
    adminLoginChallenges,
    replyPersonaStore,
    appSettingsStore,
    imageContextProvider,
    replyContextAssembler,
  };
}
