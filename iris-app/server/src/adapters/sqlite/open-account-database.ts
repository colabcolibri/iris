import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "./connection.ts";

export function openAccountDatabase(url: string, _authToken: string | null): DatabaseSync {
  if (url.startsWith("libsql:") || url.startsWith("https:")) {
    throw new Error("remote database urls are not supported");
  }
  const path = url.startsWith("file:") ? url.slice("file:".length) : url;
  return openDatabase(path);
}
