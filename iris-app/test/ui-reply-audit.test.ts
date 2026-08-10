import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("reply audit UI is wired in comment surfaces", () => {
  const timeline = readFileSync(
    "admin/src/components/comments/reply-audit-timeline.tsx",
    "utf8",
  );
  assert.match(timeline, /ReplyAuditTimeline/);
  assert.match(timeline, /Ver reasoning/);
  assert.match(timeline, /Ver JSON estruturado/);

  const section = readFileSync("admin/src/components/comments/reply-audit-section.tsx", "utf8");
  assert.match(section, /Ver decisão do agente/);
  assert.match(section, /fetchReplyAudit/);

  const thread = readFileSync("admin/src/components/comments/comment-thread.tsx", "utf8");
  assert.match(thread, /ReplyAuditSection/);
  assert.match(thread, /border-l-2/);

  const dialog = readFileSync("admin/src/components/posts/post-dialog.tsx", "utf8");
  assert.match(dialog, /ReplyAuditSection/);

  const api = readFileSync("admin/src/lib/api.ts", "utf8");
  assert.match(api, /reply-audit/);
});
