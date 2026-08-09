import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const PUBLIC = "public";

test("index.html includes kanban view and tabs", () => {
  const html = readFileSync(`${PUBLIC}/index.html`, "utf8");
  assert.match(html, /id="kanban-view"/);
  assert.match(html, /id="kanban-board"/);
  assert.match(html, /data-view="kanban"/);
  assert.match(html, /Calendário/);
  assert.match(html, /Kanban/);
});

test("kanban module supports status changes", () => {
  const kanbanJs = readFileSync(`${PUBLIC}/kanban-view.js`, "utf8");
  assert.match(kanbanJs, /createKanbanView/);
  assert.match(kanbanJs, /onStatusChange/);
  assert.match(kanbanJs, /kanban-col/);

  const css = readFileSync(`${PUBLIC}/style.css`, "utf8");
  assert.match(css, /\.kanban-board/);
  assert.match(css, /\.kanban-status-select/);
});

test("app.js wires kanban and updatePost for status", () => {
  const app = readFileSync(`${PUBLIC}/app.js`, "utf8");
  assert.match(app, /createKanbanView/);
  assert.match(app, /changePostStatus/);
  assert.match(app, /updatePost\(post\.id, \{ status: nextStatus \}\)/);
  assert.match(app, /showView/);
});
