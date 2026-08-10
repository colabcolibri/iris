import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";
import { createServer, getPublicDirectory } from "./api/http-server.ts";
import { createAdminViteDevServer } from "./dev/admin-vite.ts";
import {
  assertMcpConnectionCodeConfigured,
  McpConnectionConfigError,
} from "./domain/mcp-connection.ts";

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "../.env");
if (existsSync(envPath)) {
  loadEnvFile(envPath);
}

const port = Number(process.env.PORT ?? 8792);
const host = process.env.HOST ?? "0.0.0.0";
const isDev = process.env.NODE_ENV !== "production";
const projectRoot = dirname(getPublicDirectory());

try {
  assertMcpConnectionCodeConfigured(process.env.NODE_ENV);
} catch (error) {
  if (error instanceof McpConnectionConfigError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}

const { server, stopScheduler, setAdminVite, closeAdminVite } = createServer({
  startScheduler: true,
});

if (isDev) {
  const vite = await createAdminViteDevServer(projectRoot, server);
  setAdminVite(vite);
}

function shutdown(): void {
  stopScheduler();
  void closeAdminVite().finally(() => {
    server.close(() => process.exit(0));
  });
}

server.listen(port, host, () => {
  const displayHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  const mode = isDev ? "dev + HMR" : "produção (bundle estático)";
  console.log(`Iris → http://${displayHost}:${port}  (${mode})`);
  if (!isDev) {
    console.log("Dica: rode pnpm build:admin antes de subir em produção.");
  }
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
