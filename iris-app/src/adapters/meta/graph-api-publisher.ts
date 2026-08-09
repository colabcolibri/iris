import type { AssetRepository } from "../../ports/asset-repository.ts";
import type { MetaPublisher } from "../../ports/meta-publisher.ts";
import { metaPublishError } from "../../ports/meta-publisher.ts";
import type { MetaTokenStore } from "../../ports/meta-token-store.ts";
import {
  buildPublishImageUrl,
  filenameFromStoragePath,
} from "../../domain/publish-url.ts";

export type GraphApiPublisherConfig = {
  igUserId: string;
  publicBaseUrl: string;
  publishUrlSecret: string;
  graphApiVersion?: string;
  fetchImpl?: typeof fetch;
};

type GraphApiPublisherDeps = {
  metaTokenStore: MetaTokenStore;
  assets: AssetRepository;
  config: GraphApiPublisherConfig;
};

type GraphResponse = {
  id?: string;
  error?: { message?: string; code?: number };
};

export function createGraphApiPublisher(
  deps: GraphApiPublisherDeps,
): MetaPublisher {
  const fetchFn = deps.config.fetchImpl ?? fetch;
  const version = deps.config.graphApiVersion ?? "v21.0";
  const base = `https://graph.facebook.com/${version}`;

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

  return {
    async publish(postId) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw metaPublishError("Meta access token not configured");
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

        const created = await graphPost(`/${deps.config.igUserId}/media`, token, body);

        if (!created.id) {
          throw metaPublishError("Meta did not return container id");
        }

        containerIds.push(created.id);
      }

      let publishContainerId = containerIds[0];

      if (containerIds.length > 1) {
        const carousel = await graphPost(`/${deps.config.igUserId}/media`, token, {
          media_type: "CAROUSEL",
          children: containerIds.join(","),
        });

        if (!carousel.id) {
          throw metaPublishError("Meta did not return carousel container id");
        }

        publishContainerId = carousel.id;
      }

      const published = await graphPost(
        `/${deps.config.igUserId}/media_publish`,
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
