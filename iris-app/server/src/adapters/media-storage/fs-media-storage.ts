import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { MediaFile, MediaStorage } from "../../ports/media-storage.ts";

export function createFsMediaStorage(rootDir: string): MediaStorage {
  return {
    resolveFilename(_postId, sortOrder) {
      return `${String(sortOrder).padStart(2, "0")}.jpg`;
    },

    async write(postId, sortOrder, buffer) {
      const filename = this.resolveFilename(postId, sortOrder);
      const relativePath = `${postId}/${filename}`;
      const absoluteDir = join(rootDir, postId);
      await mkdir(absoluteDir, { recursive: true });
      await writeFile(join(rootDir, relativePath), buffer);
      return relativePath;
    },

    async read(postId, filename) {
      const safeName = filename.replace(/[/\\]/g, "");
      const absolutePath = join(rootDir, postId, safeName);

      try {
        const buffer = await readFile(absolutePath);
        return {
          filename: safeName,
          buffer,
          mime: "image/jpeg",
        };
      } catch {
        return null;
      }
    },

    async delete(postId, filename) {
      const safeName = filename.replace(/[/\\]/g, "");
      const absolutePath = join(rootDir, postId, safeName);
      try {
        await unlink(absolutePath);
      } catch {
        // arquivo já removido ou inexistente — segue com delete no banco
      }
    },
  };
}
