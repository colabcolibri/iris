import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { createServer } from "./api/http-server.ts";

const envPath = resolve(import.meta.dirname, "../.env");
if (existsSync(envPath)) {
  loadEnvFile(envPath);
}

const port = Number(process.env.PORT ?? 8792);
const host = process.env.HOST ?? "0.0.0.0";

const { server, stopScheduler } = createServer({ startScheduler: true });

function shutdown(): void {
  stopScheduler();
  server.close(() => process.exit(0));
}

server.listen(port, host, () => {
  const displayHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  console.log(`Iris listening on http://${displayHost}:${port}`);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
