import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "./connection.ts";
import { openLibsqlSyncDatabase } from "./libsql-sync-database.ts";

export function openAccountDatabase(url: string, authToken: string | null): DatabaseSync {
  if (url.startsWith("libsql:") || url.startsWith("https:")) {
    return openLibsqlSyncDatabase(url, authToken ?? "");
  }
  const path = url.startsWith("file:") ? url.slice("file:".length) : url;
  return openDatabase(path);
}
