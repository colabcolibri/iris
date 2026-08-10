import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const adminDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
});
