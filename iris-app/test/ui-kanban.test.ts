import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ADMIN = "admin/src";

test("admin includes kanban board", () => {
  const board = readFileSync(`${ADMIN}/components/kanban/kanban-board.tsx`, "utf8");
  assert.match(board, /KanbanBoard/);
  assert.match(board, /onStatusChange/);
  assert.match(board, /KANBAN_COLUMNS/);
});

test("kanban card supports status changes", () => {
  const card = readFileSync(`${ADMIN}/components/kanban/kanban-card.tsx`, "utf8");
  assert.match(card, /DropdownMenuGroup/);
  assert.match(card, /MOVE_STATUS_OPTIONS/);
  assert.match(card, /onStatusChange/);
  assert.match(card, /KanbanColumnShell\.Card/);
});

test("kanban uses column shell template", () => {
  const column = readFileSync(`${ADMIN}/components/templates/kanban-column-shell.tsx`, "utf8");
  assert.match(column, /KanbanColumnShell/);
  assert.match(column, /KanbanColumnShell\.Card/);
});

test("dashboard wires kanban and updatePost for status", () => {
  const dashboard = readFileSync(`${ADMIN}/pages/dashboard-page.tsx`, "utf8");
  assert.match(dashboard, /KanbanBoard/);
  assert.match(dashboard, /changeStatus/);
  assert.match(dashboard, /updatePost\(post\.id, \{ status \}\)/);
  assert.match(dashboard, /PostDialog/);
});
