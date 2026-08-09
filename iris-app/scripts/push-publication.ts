#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { basename } from "node:path";
import {
  loadLocalPackage,
  validatePackage,
  writePackageFrontmatter,
} from "../src/domain/local-package.ts";

type PushOptions = {
  apiUrl: string;
  agentToken: string;
  packageDir: string;
};

async function apiRequest(
  options: PushOptions,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Authorization", `Bearer ${options.agentToken}`);

  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${options.apiUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers,
  });
}

export async function pushLocalPackage(options: PushOptions): Promise<string> {
  const pkg = loadLocalPackage(options.packageDir);
  validatePackage(pkg);

  const createResponse = await apiRequest(options, "/api/posts", {
    method: "POST",
    body: JSON.stringify({
      caption: pkg.caption,
      channel: pkg.frontmatter.channel,
      scheduled_at: pkg.frontmatter.scheduledAt,
      source_note: pkg.frontmatter.sourceNote,
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.json().catch(() => ({}));
    throw new Error(
      (error as { error?: string }).error ?? `create post failed (${createResponse.status})`,
    );
  }

  const created = (await createResponse.json()) as { id: string };
  let sortOrder = 1;

  for (const imagePath of pkg.imagePaths) {
    const form = new FormData();
    const buffer = readFileSync(imagePath);
    const blob = new Blob([buffer]);
    form.append("file", blob, basename(imagePath));
    form.append("sort_order", String(sortOrder));

    const uploadResponse = await apiRequest(
      options,
      `/api/posts/${created.id}/assets`,
      {
        method: "POST",
        body: form,
      },
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json().catch(() => ({}));
      throw new Error(
        (error as { error?: string }).error ??
          `upload asset failed (${uploadResponse.status})`,
      );
    }

    sortOrder += 1;
  }

  if (pkg.frontmatter.scheduledAt) {
    const scheduleResponse = await apiRequest(options, `/api/posts/${created.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "scheduled",
        scheduled_at: pkg.frontmatter.scheduledAt,
      }),
    });

    if (!scheduleResponse.ok) {
      const error = await scheduleResponse.json().catch(() => ({}));
      throw new Error(
        (error as { error?: string }).error ??
          `schedule post failed (${scheduleResponse.status})`,
      );
    }
  }

  const pushedAt = new Date().toISOString();
  writePackageFrontmatter(
    options.packageDir,
    {
      ...pkg.frontmatter,
      irisPostId: created.id,
      pushedAt,
      status: "ready",
    },
    pkg.caption,
  );

  return created.id;
}

async function main(): Promise<void> {
  const packageArg = process.argv[2];
  if (!packageArg) {
    console.error("Usage: node --experimental-strip-types scripts/push-publication.ts <publications/slug>");
    process.exit(1);
  }

  const apiUrl = process.env.IRIS_API_URL ?? "http://127.0.0.1:8792";
  const agentToken = process.env.IRIS_AGENT_TOKEN;

  if (!agentToken) {
    console.error("IRIS_AGENT_TOKEN is required");
    process.exit(1);
  }

  const postId = await pushLocalPackage({
    apiUrl,
    agentToken,
    packageDir: packageArg,
  });

  console.log(`Pushed publication to post ${postId}`);
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "push failed");
    process.exit(1);
  });
}
