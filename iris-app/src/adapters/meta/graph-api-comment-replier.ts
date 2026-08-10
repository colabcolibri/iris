import type { MetaTokenStore } from "../../ports/meta-token-store.ts";
import type { MetaCommentReplier } from "../../ports/meta-comment-replier.ts";

export type GraphApiCommentReplierConfig = {
  graphApiVersion?: string;
  fetchImpl?: typeof fetch;
};

type GraphApiCommentReplierDeps = {
  metaTokenStore: MetaTokenStore;
  config?: GraphApiCommentReplierConfig;
};

type GraphResponse = {
  id?: string;
  error?: { message?: string; code?: number };
};

export function createGraphApiCommentReplier(
  deps: GraphApiCommentReplierDeps,
): MetaCommentReplier {
  const fetchFn = deps.config?.fetchImpl ?? fetch;
  const version = deps.config?.graphApiVersion ?? "v21.0";
  const base = `https://graph.instagram.com/${version}`;

  return {
    async reply(igCommentId, message) {
      const token = deps.metaTokenStore.getActiveToken();
      if (!token) {
        throw new Error("Meta access token not configured");
      }

      const params = new URLSearchParams({
        message,
        access_token: token,
      });

      const response = await fetchFn(
        `${base}/${igCommentId}/replies?${params.toString()}`,
        { method: "POST" },
      );

      const json = (await response.json()) as GraphResponse;

      if (!response.ok || json.error) {
        throw new Error(json.error?.message ?? `Meta API error (${response.status})`);
      }
    },
  };
}
