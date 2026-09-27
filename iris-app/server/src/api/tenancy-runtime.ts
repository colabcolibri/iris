import { dirname, join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { verifyMcpConnectionCodeHash } from "../domain/mcp/mcp-connection-verifier.ts";
import { DATA_DIR } from "../paths.ts";
import { createAccountStore, type AccountRecord, type AccountStore } from "../adapters/sqlite/account-store.ts";
import { openControlDatabase } from "../adapters/sqlite/control-database.ts";
import { createSqliteAdminLoginChallengeRepository } from "../adapters/sqlite/admin-login-challenge-repository.ts";
import type { AdminLoginChallengeRepository } from "../adapters/sqlite/admin-login-challenge-repository.ts";
import {
  applyMigrationsToAccount,
  createLocalProvisioner,
  ensureAccountDatabase,
  openStoredAccountDatabase,
} from "../domain/accounts/provision-account.ts";
import type { TenancyConfig } from "../domain/accounts/tenancy-config.ts";
import { createAppContext, type AppContext, type AppContextOptions } from "./app-context.ts";

export type TenancyRuntime = {
  enabled: true;
  control: DatabaseSync;
  challenges: AdminLoginChallengeRepository;
  contextForAccount(accountId: string): AppContext | null;
  contextForIgUserId(igUserId: string): AppContext | null;
  contextForMcpCode(code: string): AppContext | null;
  listContexts(): AppContext[];
  ensureAccount(email: string): Promise<{ id: string; slug: string; email: string }>;
  invalidate(accountId: string): void;
  filePathFor(accountId: string): string | null;
  migrateAll(): Array<{ accountId: string; version: string; error?: string }>;
  close(): void;
};

export function createTenancyRuntime(input: {
  config: TenancyConfig;
  controlDbPath?: string;
  dataRoot?: string;
  contextOptions: Omit<AppContextOptions, "db" | "mediaRoot" | "accountId" | "accountSlug">;
}): TenancyRuntime {
  if (!input.config.enabled || input.config.mode !== "local") {
    throw new Error("account files require local tenancy");
  }

  const dataRoot =
    input.dataRoot ??
    (input.controlDbPath ? dirname(input.controlDbPath) : DATA_DIR);
  const control = openControlDatabase(input.controlDbPath);
  const store = createAccountStore(control, input.contextOptions.encryptionKey);
  const provisioner = createLocalProvisioner(dataRoot);

  const cache = new Map<string, AppContext>();

  function contextForRecord(record: AccountRecord): AppContext | null {
    if (!record.databaseUrl || record.status !== "active") {
      return null;
    }
    const cached = cache.get(record.id);
    if (cached) {
      return cached;
    }
    const db = openStoredAccountDatabase(record.databaseUrl, record.authToken);
    const ctx = createAppContext({
      ...input.contextOptions,
      db,
      mediaRoot: join(dataRoot, "tenants", record.id, "media"),
      accountId: record.id,
      accountSlug: record.slug,
    });
    cache.set(record.id, ctx);
    return ctx;
  }

  function requireRecord(record: AccountRecord | null): AppContext | null {
    return record ? contextForRecord(record) : null;
  }

  return {
    enabled: true,
    control,
    challenges: createSqliteAdminLoginChallengeRepository(control),
    contextForAccount(accountId: string) {
      const cached = cache.get(accountId);
      if (cached) {
        return cached;
      }
      return requireRecord(store.findById(accountId));
    },
    contextForIgUserId(igUserId: string) {
      const wanted = igUserId.trim();
      if (!wanted) {
        return null;
      }
      for (const account of store.listActive()) {
        const ctx = contextForRecord(account);
        if (ctx?.metaConnectionStore.get()?.igUserId === wanted) {
          return ctx;
        }
      }
      return null;
    },
    contextForMcpCode(code: string) {
      for (const account of store.listActive()) {
        const ctx = contextForRecord(account);
        const hash = ctx?.mcpConnectionStore.get()?.codeHash;
        if (ctx && hash && verifyMcpConnectionCodeHash(code, hash)) {
          return ctx;
        }
      }
      return null;
    },
    listContexts() {
      return store
        .listActive()
        .map((account) => contextForRecord(account))
        .filter((ctx): ctx is AppContext => ctx !== null);
    },
    ensureAccount(email: string) {
      return ensureAccountDatabase({ store, email, provisioner });
    },
    invalidate(accountId: string) {
      const cached = cache.get(accountId);
      if (cached) {
        cached.db.close();
        cache.delete(accountId);
      }
    },
    filePathFor(accountId: string): string | null {
      const record = store.findById(accountId);
      if (!record?.databaseUrl?.startsWith("file:")) {
        return null;
      }
      return record.databaseUrl.slice("file:".length);
    },
    migrateAll() {
      const results: Array<{ accountId: string; version: string; error?: string }> = [];
      for (const account of store.listActive()) {
        if (!account.databaseUrl) {
          continue;
        }
        let db: ReturnType<typeof openStoredAccountDatabase> | null = null;
        try {
          db = openStoredAccountDatabase(account.databaseUrl, account.authToken);
          const version = applyMigrationsToAccount(db);
          store.saveMigrationVersion(account.id, version);
          cache.delete(account.id);
          results.push({ accountId: account.id, version });
        } catch (error) {
          const message = error instanceof Error ? error.message : "migration failed";
          results.push({
            accountId: account.id,
            version: account.migrationVersion ?? "",
            error: message,
          });
        } finally {
          db?.close();
        }
      }
      return results;
    },
    close() {
      for (const ctx of cache.values()) {
        ctx.db.close();
      }
      cache.clear();
      control.close();
    },
  };
}

export type { AccountStore };
