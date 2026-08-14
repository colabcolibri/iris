import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("post dialog includes reply inspection UI", () => {
  const dialog = readFileSync("../admin/src/components/posts/post-dialog.tsx", "utf8");
  assert.match(dialog, /postsMsg\.dialog\.tabs\.caption/);
  assert.match(dialog, /CommentThread/);
  assert.match(dialog, /fetchComments/);
  assert.match(dialog, /postsMsg\.dialog\.fields\.editPersona/);
  assert.match(dialog, /routes\.persona/);
  assert.match(dialog, /CarouselSummaryEditor/);
  assert.match(dialog, /PostMediaSection/);
  assert.match(dialog, /carousel_summary/);
});
