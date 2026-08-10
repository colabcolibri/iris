import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("post dialog includes reply inspection UI", () => {
  const dialog = readFileSync("admin/src/components/posts/post-dialog.tsx", "utf8");
  assert.match(dialog, /Contexto do post/);
  assert.match(dialog, /Ver conversa/);
  assert.match(dialog, /fetchReplyInspection/);
  assert.match(dialog, /entry\.depth/);
  assert.match(dialog, /Editar persona/);
  assert.match(dialog, /to="\/persona"/);
});
