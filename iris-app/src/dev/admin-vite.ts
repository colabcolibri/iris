import type { Server } from "node:http";
import { join } from "node:path";
import type { ViteDevServer } from "vite";

export async function createAdminViteDevServer(
  projectRoot: string,
  httpServer: Server,
): Promise<ViteDevServer> {
  const { createServer } = await import("vite");

  const adminRoot = join(projectRoot, "admin");

  const vite = await createServer({
    root: adminRoot,
    configFile: join(adminRoot, "vite.config.ts"),
    server: {
      middlewareMode: true,
      hmr: { server: httpServer },
    },
    appType: "spa",
  });

  return vite;
}
