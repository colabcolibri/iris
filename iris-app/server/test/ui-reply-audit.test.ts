import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("reply audit UI is wired in comment surfaces", () => {
  const timeline = readFileSync(
    "../admin/src/components/comments/reply-audit-timeline.tsx",
    "utf8",
  );
  assert.match(timeline, /ReplyAuditTimeline/);
  assert.match(timeline, /auditMessages\.detailTabs\.reasoning/);
  assert.match(timeline, /auditMessages\.detailTabs\.json/);

  const section = readFileSync("../admin/src/components/comments/reply-audit-section.tsx", "utf8");
  const thread = readFileSync("../admin/src/components/comments/comment-thread.tsx", "utf8");
  assert.match(section, /thread\.viewAudit/);
  assert.match(thread, /ReplyAuditTrigger/);
  assert.match(section, /fetchReplyAudit/);

  assert.match(thread, /ReplyAuditPanel/);
  assert.match(thread, /PinnedPostCommentBadge/);
  assert.match(thread, /Pin/);
  assert.match(thread, /AppAccordion/);
  assert.doesNotMatch(thread, /depth \+ 1/);

  const dialog = readFileSync("../admin/src/components/posts/post-dialog.tsx", "utf8");
  assert.match(dialog, /CommentThread/);

  const api = readFileSync("../admin/src/lib/api.ts", "utf8");
  assert.match(api, /reply-audit/);
});
