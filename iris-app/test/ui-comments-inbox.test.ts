import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("comments page includes inbox sync UI", () => {
  const page = readFileSync("admin/src/pages/comments-page.tsx", "utf8");
  assert.match(page, /fetchCommentsInbox/);
  assert.match(page, /Últimos 30 dias/);
  assert.match(page, /comment\.depth/);
});

test("app sidebar includes comments in main navigation", () => {
  const navigation = readFileSync("admin/src/components/layout/app-navigation.tsx", "utf8");
  assert.match(navigation, /Comentários/);
  assert.match(navigation, /\/comments/);
  assert.match(navigation, /VIEW_ITEMS\.map/);
});

test("mobile nav exposes sidebar links", () => {
  const mobile = readFileSync("admin/src/components/layout/app-mobile-nav.tsx", "utf8");
  assert.match(mobile, /AppNavigation/);
  assert.match(mobile, /Abrir menu/);
});
