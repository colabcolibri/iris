import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  AgentContent,
  AgentContentInput,
  AgentContentStore,
} from "../../ports/agent-content-store.ts";
import { defaultAgentContent } from "../../domain/agent-content-defaults.ts";

const FILE_NAMES = {
  soul: "soul.md",
  page: "page.md",
  knowledge: "knowledge.md",
  restrictions: "restrictions.md",
} as const;

export type FsAgentContentStoreOptions = {
  rootDir: string;
};

function ensureDir(rootDir: string) {
  if (!existsSync(rootDir)) {
    mkdirSync(rootDir, { recursive: true });
  }
}

function readField(rootDir: string, fileName: string, fallback: string): string {
  const path = join(rootDir, fileName);
  if (!existsSync(path)) {
    return fallback;
  }
  return readFileSync(path, "utf8");
}

function latestMtime(rootDir: string): string {
  const times = Object.values(FILE_NAMES).map((name) => {
    const path = join(rootDir, name);
    if (!existsSync(path)) {
      return 0;
    }
    return statSync(path).mtimeMs;
  });
  const max = Math.max(...times, Date.now());
  return new Date(max).toISOString();
}

export function createFsAgentContentStore(options: FsAgentContentStoreOptions): AgentContentStore {
  const rootDir = options.rootDir;

  return {
    get() {
      const defaults = defaultAgentContent();
      ensureDir(rootDir);

      return {
        soul: readField(rootDir, FILE_NAMES.soul, defaults.soul),
        page: readField(rootDir, FILE_NAMES.page, defaults.page),
        knowledge: readField(rootDir, FILE_NAMES.knowledge, defaults.knowledge),
        restrictions: readField(rootDir, FILE_NAMES.restrictions, defaults.restrictions),
        updatedAt: latestMtime(rootDir),
      };
    },

    upsert(input: AgentContentInput) {
      ensureDir(rootDir);
      const updatedAt = new Date().toISOString();

      writeFileSync(join(rootDir, FILE_NAMES.soul), input.soul, "utf8");
      writeFileSync(join(rootDir, FILE_NAMES.page), input.page, "utf8");
      writeFileSync(join(rootDir, FILE_NAMES.knowledge), input.knowledge, "utf8");
      writeFileSync(join(rootDir, FILE_NAMES.restrictions), input.restrictions, "utf8");

      return { ...input, updatedAt };
    },
  };
}

export function resolveAgentContentDir(appRoot: string): string {
  const fromEnv = process.env.IRIS_AGENT_CONTENT_DIR?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return join(appRoot, "data", "agent");
}
