import type { AssetRepository } from "../../ports/asset-repository.ts";
import type { MetaPublisher } from "../../ports/meta-publisher.ts";
import { metaPublishError } from "../../ports/meta-publisher.ts";
import type { MetaTokenStore } from "../../ports/meta-token-store.ts";
import {
  buildPublishImageUrl,
  filenameFromStoragePath,
} from "../../domain/posts/publish-url.ts";

export type GraphApiPublisherConfig = {
  resolveIgUserId: () => string | null;
  publicBaseUrl: string;
  publishUrlSecret: string;
  graphApiVersion?: string;
  fetchImpl?: typeof fetch;
  /** Delay between container status polls (default 2s). */
  containerPollIntervalMs?: number;
  /** Max polls per container before timeout (default 90 ≈ 3 min). */
  containerPollMaxAttempts?: number;
};

type GraphApiPublisherDeps = {
  metaTokenStore: MetaTokenStore;
  assets: AssetRepository;
  config: GraphApiPublisherConfig;
};

type GraphResponse = {
  id?: string;
  status_code?: string;
  status?: string;
  error?: { message?: string; code?: number };
};

const TERMINAL_ERROR = new Set(["ERROR", "EXPIRED"]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createGraphApiPublisher(
  deps: GraphApiPublisherDeps,
): MetaPublisher {
  const fetchFn = deps.config.fetchImpl ?? fetch;
  const version = deps.config.graphApiVersion ?? "v21.0";
  const base = `https://graph.instagram.com/${version}`;
  const pollIntervalMs = deps.config.containerPollIntervalMs ?? 2_000;
  const pollMaxAttempts = deps.config.containerPollMaxAttempts ?? 90;

  async function graphPost(
    path: string,
    token: string,
    body: Record<string, string>,
  ): Promise<GraphResponse> {
    const params = new URLSearchParams({ ...body, access_token: token });
    const response = await fetchFn(`${base}${path}?${params.toString()}`, {
      method: "POST",
    });

    const json = (await response.json()) as GraphResponse;

    if (!response.ok || json.error) {
      throw metaPublishError(
        json.error?.message ?? `Meta API error (${response.status})`,
        json.error?.code?.toString(),
      );
    }

    return json;
  }

  async function graphGet(
    path: string,
    token: string,
    fields: string,
  ): Promise<GraphResponse> {
    const params = new URLSearchParams({ fields, access_token: token });
    const response = await fetchFn(`${base}${path}?${params.toString()}`, {
      method: "GET",
    });

    const json = (await response.json()) as GraphResponse;

    if (!response.ok || json.error) {
      throw metaPublishError(
        json.error?.message ?? `Meta API error (${response.status})`,
        json.error?.code?.toString(),
      );
    }

    return json;
  }

  /**
   * Meta processes containers asynchronously. Publishing before FINISHED
   * yields "Media ID is not available".
   */
  async function waitUntilContainerReady(
    containerId: string,
    token: string,
  ): Promise<void> {
    for (let attempt = 0; attempt < pollMaxAttempts; attempt += 1) {
      const status = await graphGet(
        `/${containerId}`,
        token,
        "status_code,status",
      );
      const code = status.status_code;

      if (code === "FINISHED" || code === "PUBLISHED") {
        return;
      }

      if (code && TERMINAL_ERROR.has(code)) {
        throw metaPublishError(
          `Meta container ${containerId} failed (${code})${
            status.status ? `: ${status.status}` : ""
          }`,
        );
      }

      await sleep(pollIntervalMs);
    }

    throw metaPublishError(
      `Meta container ${containerId} not ready after ${pollMaxAttempts} polls`,
    );
  }

  return {
    async publish(postId) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw metaPublishError("Meta access token not configured");
      }

      const igUserId = deps.config.resolveIgUserId();
      if (!igUserId) {
        throw metaPublishError("IG user id not configured");
      }

      const assets = deps.assets.listByPostId(postId);
      if (assets.length === 0) {
        throw metaPublishError("post has no assets to publish");
      }

      const containerIds: string[] = [];

      for (const asset of assets) {
        const filename = filenameFromStoragePath(asset.storagePath);
        const imageUrl = buildPublishImageUrl(
          postId,
          filename,
          deps.config.publicBaseUrl,
          deps.config.publishUrlSecret,
        );

        const body: Record<string, string> = { image_url: imageUrl };

        if (assets.length > 1) {
          body.is_carousel_item = "true";
        }

        const created = await graphPost(`/${igUserId}/media`, token, body);

        if (!created.id) {
          throw metaPublishError("Meta did not return container id");
        }

        await waitUntilContainerReady(created.id, token);
        containerIds.push(created.id);
      }

      let publishContainerId = containerIds[0];

      if (containerIds.length > 1) {
        const carousel = await graphPost(`/${igUserId}/media`, token, {
          media_type: "CAROUSEL",
          children: containerIds.join(","),
        });

        if (!carousel.id) {
          throw metaPublishError("Meta did not return carousel container id");
        }

        await waitUntilContainerReady(carousel.id, token);
        publishContainerId = carousel.id;
      }

      const published = await graphPost(
        `/${igUserId}/media_publish`,
        token,
        { creation_id: publishContainerId },
      );

      if (!published.id) {
        throw metaPublishError("Meta did not return ig media id");
      }

      return { igMediaId: published.id };
    },
  };
}
