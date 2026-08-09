import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, extname, basename } from "node:path";
import { ValidationError } from "../api/json.ts";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

export type LocalPackageFrontmatter = {
  title: string;
  scheduledAt: string | null;
  channel: string;
  status: string;
  sourceNote: string | null;
  irisPostId: string | null;
  pushedAt: string | null;
};

export type LocalPackage = {
  directory: string;
  slug: string;
  frontmatter: LocalPackageFrontmatter;
  caption: string;
  imagePaths: string[];
};

export function parsePostMarkdown(content: string): {
  frontmatter: LocalPackageFrontmatter;
  caption: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u.exec(content);

  if (!match) {
    throw new ValidationError("post.md must include YAML frontmatter");
  }

  const frontmatterRaw = match[1];
  const caption = match[2].trim();
  const values = new Map<string, string>();

  for (const line of frontmatterRaw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf(":");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    values.set(key, value);
  }

  const readField = (key: string): string | null => {
    const value = values.get(key);
    if (!value || value.length === 0) {
      return null;
    }
    return value;
  };

  const title = readField("title");
  if (!title) {
    throw new ValidationError("post.md frontmatter requires title");
  }

  const channel = readField("channel");
  if (!channel) {
    throw new ValidationError("post.md frontmatter requires channel");
  }

  const status = readField("status");
  if (!status) {
    throw new ValidationError("post.md frontmatter requires status");
  }

  return {
    frontmatter: {
      title,
      scheduledAt: readField("scheduled_at"),
      channel,
      status,
      sourceNote: readField("source_note"),
      irisPostId: readField("iris_post_id"),
      pushedAt: readField("pushed_at"),
    },
    caption,
  };
}

export function loadLocalPackage(directory: string): LocalPackage {
  const postPath = join(directory, "post.md");
  const content = readFileSync(postPath, "utf8");
  const parsed = parsePostMarkdown(content);
  const imagePaths = listImageFiles(directory);

  return {
    directory,
    slug: basename(directory),
    frontmatter: parsed.frontmatter,
    caption: parsed.caption,
    imagePaths,
  };
}

export function listImageFiles(directory: string): string[] {
  const files = readdirSync(directory)
    .filter((name) => IMAGE_EXTENSIONS.has(extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return files.map((name) => join(directory, name));
}

export function validatePackage(pkg: LocalPackage): void {
  if (pkg.frontmatter.status !== "ready") {
    throw new ValidationError(`package status must be ready (got ${pkg.frontmatter.status})`);
  }

  if (!pkg.caption.trim()) {
    throw new ValidationError("caption must not be empty");
  }

  if (pkg.imagePaths.length < 1) {
    throw new ValidationError("package must include at least one image");
  }

  if (pkg.frontmatter.scheduledAt) {
    const scheduledMs = new Date(pkg.frontmatter.scheduledAt).getTime();
    if (Number.isNaN(scheduledMs) || scheduledMs <= Date.now()) {
      throw new ValidationError("scheduled_at must be a valid future ISO date");
    }
  }
}

export function writePackageFrontmatter(
  directory: string,
  frontmatter: LocalPackageFrontmatter,
  caption: string,
): void {
  const lines = [
    "---",
    `title: ${frontmatter.title}`,
    `scheduled_at: ${frontmatter.scheduledAt ?? ""}`,
    `channel: ${frontmatter.channel}`,
    `status: ${frontmatter.status}`,
    `source_note: ${frontmatter.sourceNote ?? ""}`,
    `iris_post_id: ${frontmatter.irisPostId ?? ""}`,
    `pushed_at: ${frontmatter.pushedAt ?? ""}`,
    "---",
    "",
    caption,
  ];

  if (caption && !caption.endsWith("\n")) {
    lines.push("");
  }

  writeFileSync(join(directory, "post.md"), lines.join("\n"), "utf8");
}
