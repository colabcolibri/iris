import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { createServer } from "./api/http-server.ts";
import { createAdminViteDevServer } from "./dev/admin-vite.ts";
import { localTenancyConfig } from "./domain/accounts/tenancy-config.ts";
import { WORKSPACE_ENV_LOCAL_PATH, WORKSPACE_ENV_PATH, WORKSPACE_ROOT } from "./paths.ts";

if (existsSync(WORKSPACE_ENV_PATH)) {
  loadEnvFile(WORKSPACE_ENV_PATH);
}
if (existsSync(WORKSPACE_ENV_LOCAL_PATH)) {
  loadEnvFile(WORKSPACE_ENV_LOCAL_PATH);
}

const port = Number(process.env.PORT ?? 8792);
const host = process.env.HOST ?? "0.0.0.0";
const isDev = process.env.NODE_ENV !== "production";

const { server, stopScheduler, closeDatabase, setAdminVite, closeAdminVite } = createServer({
  startScheduler: true,
  tenancy: localTenancyConfig(),
});

if (isDev) {
  const vite = await createAdminViteDevServer(WORKSPACE_ROOT, server);
  setAdminVite(vite);
}

function shutdown(): void {
  stopScheduler();
  void closeAdminVite().finally(() => {
    server.close(() => {
      closeDatabase();
      process.exit(0);
    });
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
