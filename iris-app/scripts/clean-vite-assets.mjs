import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = join(fileURLToPath(new URL("..", import.meta.url)), "public");

/** Desk vanilla removido — não deve voltar após migração React. */
const LEGACY_ROOT_FILES = [
  "app.js",
  "login.html",
  "login.js",
  "kanban-view.js",
  "calendar-view.js",
  "api-client.js",
  "datetime.js",
  "date-utils.js",
  "status-labels.js",
  "style.css",
  "iris-tokens.css",
];

for (const name of LEGACY_ROOT_FILES) {
  const filePath = join(publicDir, name);
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

const assetsDir = join(publicDir, "assets");
if (existsSync(assetsDir)) {
  for (const name of readdirSync(assetsDir)) {
    if (/^index-[A-Za-z0-9_-]+\.(js|css)$/.test(name)) {
      unlinkSync(join(assetsDir, name));
    }
  }
}
