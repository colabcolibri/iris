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
    metaTokenStore: {
      getActiveToken: () => "token",
      upsertToken: () => undefined,
      clear: () => undefined,
    },
    config: {
      fetchImpl: fetchImpl as typeof fetch,
      resolveIgUserId: () => "ig-user",
    },
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
    metaTokenStore: {
      getActiveToken: () => "token",
      upsertToken: () => undefined,
      clear: () => undefined,
    },
    config: {
      fetchImpl: fetchImpl as typeof fetch,
      resolveIgUserId: () => "ig-user",
    },
  });

  const insights = await reader.getMediaInsights("media-1", ["reach", "views"]);
  assert.equal(insights.length, 2);
  assert.deepEqual(
    insights.map((item) => item.name).sort(),
    ["reach", "views"],
  );
});

test("graph api insights reader fetches account insights with period", async () => {
  const fetchImpl = async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    assert.match(url.pathname, /\/ig-user\/insights$/);
    assert.equal(url.searchParams.get("period"), "day");
    assert.equal(url.searchParams.get("since"), "1700000000");

    return new Response(
      JSON.stringify({
        data: [
          {
            name: "reach",
            period: "day",
            values: [{ value: 5 }],
          },
        ],
      }),
      { status: 200 },
    );
  };

  const reader = createGraphApiInsightsReader({
    metaTokenStore: {
      getActiveToken: () => "token",
      upsertToken: () => undefined,
      clear: () => undefined,
    },
    config: {
      fetchImpl: fetchImpl as typeof fetch,
      resolveIgUserId: () => "ig-user",
    },
  });

  const insights = await reader.getAccountInsights({
    metrics: ["reach"],
    period: "day",
    since: 1_700_000_000,
  });
  assert.equal(insights[0]?.values[0]?.value, 5);
});

test("graph api insights reader lists media page with embedded insights", async () => {
  const fetchImpl = async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    assert.match(url.pathname, /\/me\/media$/);
    assert.match(url.searchParams.get("fields") ?? "", /insights\.metric/);

    return new Response(
      JSON.stringify({
        data: [
          {
            id: "m1",
            caption: "a",
            timestamp: "2026-08-10T12:00:00+0000",
            like_count: 3,
            comments_count: 1,
            insights: {
              data: [
                { name: "likes", period: "lifetime", values: [{ value: 3 }] },
              ],
            },
          },
          {
            id: "m2",
            caption: "old",
            timestamp: "2026-07-01T12:00:00+0000",
            like_count: 1,
            comments_count: 0,
            insights: { data: [] },
          },
        ],
        paging: { cursors: { after: "next-1" } },
      }),
      { status: 200 },
    );
  };

  const reader = createGraphApiInsightsReader({
    metaTokenStore: {
      getActiveToken: () => "token",
      upsertToken: () => undefined,
      clear: () => undefined,
    },
    config: {
      fetchImpl: fetchImpl as typeof fetch,
      resolveIgUserId: () => "ig-user",
    },
  });

  const page = await reader.listMediaPageWithInsights({
    limit: 25,
    sinceIso: "2026-08-01T00:00:00.000Z",
  });
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0]?.igMediaId, "m1");
  assert.equal(page.items[0]?.insights[0]?.values[0]?.value, 3);
  assert.equal(page.nextCursor, "next-1");
});
