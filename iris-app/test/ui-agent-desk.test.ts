import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const SITE = "../iris-agent/site";

test("agent desk site scaffold exists", () => {
  const required = [
    `${SITE}/index.html`,
    `${SITE}/sw.js`,
    `${SITE}/manifest.webmanifest`,
    `${SITE}/css/iris-tokens.css`,
    `${SITE}/css/style.css`,
    `${SITE}/css/desk-overrides.css`,
    `${SITE}/js/app.js`,
    `${SITE}/js/app.bundle.js`,
    `${SITE}/js/api-client.js`,
    `${SITE}/js/calendar-view.js`,
    `${SITE}/js/kanban-view.js`,
  ];

  for (const file of required) {
    assert.ok(existsSync(file), `missing ${file}`);
  }
});

test("agent desk index wires modules and views", () => {
  const html = readFileSync(`${SITE}/index.html`, "utf8");
  assert.match(html, /id="calendar-view"/);
  assert.match(html, /id="kanban-view"/);
  assert.match(html, /desk-view-tabs/);
  assert.match(html, /app\.bundle\.js/);
  assert.match(html, /js\/app\.js/);
});

test("agent desk app loads posts via bearer api", () => {
  const api = readFileSync(`${SITE}/js/api-client.js`, "utf8");
  assert.match(api, /Authorization.*Bearer/);
  assert.match(api, /\/api\/posts/);
  assert.match(api, /listAssets/);
  assert.match(api, /fetchAssetBlob/);

  const app = readFileSync(`${SITE}/js/app.js`, "utf8");
  assert.match(app, /loadPosts/);

  const detail = readFileSync(`${SITE}/js/detail-panel.js`, "utf8");
  assert.match(detail, /detail-media-gallery/);
});
