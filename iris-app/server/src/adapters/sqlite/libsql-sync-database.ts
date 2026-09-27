import { MessageChannel, Worker, receiveMessageOnPort } from "node:worker_threads";
import type { DatabaseSync } from "node:sqlite";

type SyncResult = {
  columns: string[];
  rows: unknown[][];
  rowsAffected: number;
};

type SyncReply = { ok: true; result: SyncResult } | { ok: false; error: string };

/**
 * Synchronous facade over Turso's HTTP pipeline so repositories keep
 * prepare/get/all/run. Local files stay on node:sqlite.
 */
export function openLibsqlSyncDatabase(url: string, authToken: string): DatabaseSync {
  const worker = new Worker(new URL("./libsql-sync-worker.ts", import.meta.url), {
    execArgv: ["--experimental-strip-types"],
    workerData: { url, authToken },
  });
  const { port1, port2 } = new MessageChannel();
  worker.postMessage({ port: port1 }, [port1]);
  const sab = new SharedArrayBuffer(4);
  const flag = new Int32Array(sab);

  function call(sql: string, args: unknown[]): SyncResult {
    Atomics.store(flag, 0, 0);
    port2.postMessage({ sql, args, sab });
    const wait = Atomics.wait(flag, 0, 0, 30_000);
    if (wait === "timed-out") {
      throw new Error("libsql sync timed out");
    }
    const received = receiveMessageOnPort(port2);
    const reply = received?.message as SyncReply | undefined;
    if (!reply) {
      throw new Error("libsql sync returned no result");
    }
    if (!reply.ok) {
      throw new Error(reply.error);
    }
    return reply.result;
  }

  function rowsToObjects(result: SyncResult): Record<string, unknown>[] {
    return result.rows.map((row) => {
      const record: Record<string, unknown> = {};
      result.columns.forEach((column, index) => {
        record[column] = row[index];
      });
      return record;
    });
  }

  const db = {
    prepare(sql: string) {
      return {
        get: (...args: unknown[]) => rowsToObjects(call(sql, args))[0],
        all: (...args: unknown[]) => rowsToObjects(call(sql, args)),
        run: (...args: unknown[]) => ({ changes: call(sql, args).rowsAffected }),
      };
    },
    exec(sql: string) {
      const statements = sql
        .split(";")
        .map((part) => part.trim())
        .filter((part) => part.length > 0 && !/^(BEGIN|COMMIT|ROLLBACK)\b/i.test(part));
      for (const statement of statements) {
        call(statement, []);
      }
    },
    close() {
      port2.close();
      void worker.terminate();
    },
  };

  return db as unknown as DatabaseSync;
}
