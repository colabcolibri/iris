import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const adminDir = path.dirname(fileURLToPath(import.meta.url));
const envDir = path.resolve(adminDir, "..");

/** Dev-only: Vite host check. Prod serves static build — no Vite dev server. */
function resolveDevAllowedHosts(env: Record<string, string>): string[] | true {
  const raw = env.VITE_ALLOWED_HOSTS?.trim();
  if (!raw) {
    return ["localhost", "127.0.0.1"];
  }
  if (raw === "*") {
    return true;
  }

  return raw
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, envDir, "");

  return {
    plugins: [react(), tailwindcss()],
    envDir,
    resolve: {
      alias: {
        "@": path.resolve(adminDir, "./src"),
        "@iris/domain": path.resolve(adminDir, "../src/domain"),
      },
    },
    build: {
      outDir: "../public",
      emptyOutDir: false,
      copyPublicDir: true,
    },
    ...(command === "serve"
      ? { server: { allowedHosts: resolveDevAllowedHosts(env) } }
      : {}),
  };
});
