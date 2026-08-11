import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("post dialog includes comments section", () => {
  const dialog = readFileSync("../admin/src/components/posts/post-dialog.tsx", "utf8");
  assert.match(dialog, /Comentários/);
  assert.match(dialog, /fetchReplyInspection/);
  assert.match(dialog, /AppDialog/);
});

test("app dialog template composes shadcn dialog", () => {
  const template = readFileSync("../admin/src/components/templates/app-dialog.tsx", "utf8");
  assert.match(template, /AppDialog\.Header/);
  assert.match(template, /AppDialog\.Body/);
  assert.match(template, /AppDialog\.Footer/);
  assert.match(template, /components\/ui\/dialog/);
});
