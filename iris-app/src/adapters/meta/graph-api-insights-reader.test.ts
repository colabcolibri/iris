import { test } from "node:test";
import assert from "node:assert/strict";
import { createGraphApiInsightsReader } from "./graph-api-insights-reader.ts";

test("graph api insights reader fetches media metrics", async () => {
  const fetchImpl = async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    assert.match(url.pathname, /\/media-1\/insights$/);
    assert.match(url.search, /metric=impressions/);

    return new Response(
      JSON.stringify({
        data: [
          {
            name: "impressions",
            period: "lifetime",
            values: [{ value: 12 }],
          },
        ],
      }),
      { status: 200 },
    );
  };

  const reader = createGraphApiInsightsReader({
    metaTokenStore: { getActiveToken: () => "token" },
    config: { fetchImpl: fetchImpl as typeof fetch },
  });

  const insights = await reader.getMediaInsights("media-1", ["impressions"]);
  assert.equal(insights.length, 1);
  assert.equal(insights[0]?.name, "impressions");
  assert.equal(insights[0]?.values[0]?.value, 12);
});
