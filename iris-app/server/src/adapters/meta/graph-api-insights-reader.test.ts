import { test } from "node:test";
import assert from "node:assert/strict";
import { createGraphApiInsightsReader } from "./graph-api-insights-reader.ts";

test("graph api insights reader fetches media metrics without impressions", async () => {
  const fetchImpl = async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    assert.match(url.pathname, /\/media-1\/insights$/);
    assert.match(url.search, /metric=reach/);
    assert.doesNotMatch(url.search, /impressions/);

    return new Response(
      JSON.stringify({
        data: [
          {
            name: "reach",
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

  const insights = await reader.getMediaInsights("media-1", ["reach"]);
  assert.equal(insights.length, 1);
  assert.equal(insights[0]?.name, "reach");
  assert.equal(insights[0]?.values[0]?.value, 12);
});

test("graph api insights reader falls back to per-metric when batch fails", async () => {
  const fetchImpl = async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    const metric = url.searchParams.get("metric");

    if (metric === "reach,views") {
      return new Response(
        JSON.stringify({
          error: { message: "batch unsupported" },
        }),
        { status: 400 },
      );
    }

    if (metric === "reach") {
      return new Response(
        JSON.stringify({
          data: [{ name: "reach", period: "lifetime", values: [{ value: 7 }] }],
        }),
        { status: 200 },
      );
    }

    if (metric === "views") {
      return new Response(
        JSON.stringify({
          data: [{ name: "views", period: "lifetime", values: [{ value: 21 }] }],
        }),
        { status: 200 },
      );
    }

    return new Response(JSON.stringify({ data: [] }), { status: 200 });
  };

  const reader = createGraphApiInsightsReader({
    metaTokenStore: { getActiveToken: () => "token" },
    config: { fetchImpl: fetchImpl as typeof fetch },
  });

  const insights = await reader.getMediaInsights("media-1", ["reach", "views"]);
  assert.equal(insights.length, 2);
  assert.deepEqual(
    insights.map((item) => item.name).sort(),
    ["reach", "views"],
  );
});
