import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { openDatabase } from "../../adapters/sqlite/connection.ts";
import { runMigrations } from "../../adapters/sqlite/migrate.ts";
import { openStoredAccountDatabase } from "./provision-account.ts";
import type { TenancyRuntime } from "../../api/tenancy-runtime.ts";

export async function importInstallation(input: {
  tenancy: TenancyRuntime;
  email: string;
  sourceDbPath: string;
  sourceMediaDir?: string;
}): Promise<{ accountId: string; slug: string; importedPosts: number; skipped: boolean }> {
  const account = await input.tenancy.ensureAccount(input.email);
  const current = input.tenancy.contextForAccount(account.id);
  if (!current) {
    throw new Error("account database missing");
  }

  if (current.posts.list().length > 0) {
    return {
      accountId: account.id,
      slug: account.slug,
      importedPosts: current.posts.list().length,
      skipped: true,
    };
  }

  const destination = input.tenancy.filePathFor(account.id);
  if (!destination) {
    throw new Error("import requires a file-backed account database");
  }

  input.tenancy.invalidate(account.id);
  copyFileSync(input.sourceDbPath, destination);
  const reopened = openStoredAccountDatabase(`file:${destination}`, null);
  try {
    runMigrations(reopened);
  } finally {
    reopened.close();
  }

  if (input.sourceMediaDir && existsSync(input.sourceMediaDir)) {
    const target = join(destination, "..", "media");
    mkdirSync(target, { recursive: true });
    for (const entry of readdirSync(input.sourceMediaDir)) {
      const from = join(input.sourceMediaDir, entry);
      const to = join(target, entry);
      if (!existsSync(to)) {
        cpSync(from, to, { recursive: true });
      }
    }
  }

  const source = openDatabase(input.sourceDbPath);
  const postCount = (
    source.prepare("SELECT COUNT(*) AS total FROM posts").get() as { total: number }
  ).total;
  source.close();

  return {
    accountId: account.id,
    slug: account.slug,
    importedPosts: postCount,
    skipped: false,
  };
}
