import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_PIPELINE_DATE_FILTER,
  filterPostsByPipelineDate,
  formatPipelineDateFilterLabel,
  matchesPipelineDateFilter,
  pipelineFilterToPresetId,
  pipelinePresetIdToFilter,
  postPipelineEditorialDate,
  resolvePipelineDateRange,
} from "./pipeline-date-filter.ts";

const TZ = "America/Sao_Paulo";
const ANCHOR = new Date("2026-08-12T15:00:00.000Z");

function post(
  overrides: Partial<{
    status: string;
    scheduled_at: string | null;
    published_at: string | null;
    created_at: string;
  }> = {},
) {
  return {
    status: "scheduled",
    scheduled_at: "2026-08-20T12:00:00.000Z",
    published_at: null,
    created_at: "2026-08-01T10:00:00.000Z",
    ...overrides,
  };
}

test("postPipelineEditorialDate uses published_at for published posts", () => {
  assert.equal(
    postPipelineEditorialDate(
      post({
        status: "published",
        published_at: "2026-08-10T12:00:00.000Z",
      }),
    ),
    "2026-08-10T12:00:00.000Z",
  );
});

test("postPipelineEditorialDate returns null for undated drafts", () => {
  assert.equal(
    postPipelineEditorialDate(post({ status: "draft", scheduled_at: null })),
    null,
  );
});

test("undated drafts always pass a window filter", () => {
  assert.equal(
    matchesPipelineDateFilter(
      post({ status: "draft", scheduled_at: null }),
      DEFAULT_PIPELINE_DATE_FILTER,
      TZ,
      ANCHOR,
    ),
    true,
  );
});

test("scheduled post outside window is excluded", () => {
  assert.equal(
    matchesPipelineDateFilter(
      post({ scheduled_at: "2026-12-01T12:00:00.000Z" }),
      DEFAULT_PIPELINE_DATE_FILTER,
      TZ,
      ANCHOR,
    ),
    false,
  );
});

test("all filter includes every dated post", () => {
  assert.equal(
    matchesPipelineDateFilter(
      post({ scheduled_at: "2027-01-01T12:00:00.000Z" }),
      { kind: "all" },
      TZ,
      ANCHOR,
    ),
    true,
  );
});

test("filterPostsByPipelineDate keeps undated drafts and in-range posts", () => {
  const posts = [
    post({ status: "draft", scheduled_at: null }),
    post({ scheduled_at: "2026-08-20T12:00:00.000Z" }),
    post({ scheduled_at: "2026-12-01T12:00:00.000Z" }),
  ];
  const filtered = filterPostsByPipelineDate(
    posts,
    DEFAULT_PIPELINE_DATE_FILTER,
    TZ,
    ANCHOR,
  );
  assert.equal(filtered.length, 2);
});

test("default preset round-trips", () => {
  const filter = pipelinePresetIdToFilter("default");
  assert.equal(pipelineFilterToPresetId(filter), "default");
});

test("custom window is detected", () => {
  const filter = { kind: "window" as const, pastDays: 7, futureDays: 21 };
  assert.equal(pipelineFilterToPresetId(filter), "custom");
});

test("formatPipelineDateFilterLabel labels all filter", () => {
  assert.equal(formatPipelineDateFilterLabel({ kind: "all" }, TZ, ANCHOR), "Tudo");
});

test("formatPipelineDateFilterLabel labels past-only window", () => {
  assert.equal(
    formatPipelineDateFilterLabel(
      { kind: "window", pastDays: 30, futureDays: 0 },
      TZ,
      ANCHOR,
    ),
    "Últimos 30 dias",
  );
});

test("default window spans today through +15 days in timezone", () => {
  const range = resolvePipelineDateRange(
    DEFAULT_PIPELINE_DATE_FILTER,
    TZ,
    ANCHOR,
  );
  assert.ok(range);
  assert.ok(range!.from <= "2026-08-12T15:00:00.000Z");
  assert.ok(range!.to >= "2026-08-20T12:00:00.000Z");
});
