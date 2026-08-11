import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countPrimaryFooterActions,
  getPostDialogFooterActions,
} from "../../admin/src/components/posts/post-dialog-footer-actions.ts";

const base = {
  metaConnected: true,
  canPublishNow: true,
  canRevertToDraft: true,
  canRetryDraft: true,
  canRetrySchedule: true,
  canDelete: true,
};

test("draft footer: delete + one primary Salvar rascunho", () => {
  const actions = getPostDialogFooterActions({
    ...base,
    status: "draft",
    mode: "edit",
    hasSchedule: true,
  });

  assert.equal(countPrimaryFooterActions(actions), 1);
  assert.deepEqual(
    actions.map((a) => [a.id, a.variant]),
    [
      ["delete", "ghost"],
      ["publish_now", "outline"],
      ["schedule", "outline"],
      ["save_draft", "default"],
    ],
  );
});

test("create mode omits delete", () => {
  const actions = getPostDialogFooterActions({
    ...base,
    status: null,
    mode: "create",
    hasSchedule: false,
  });
  assert.equal(
    actions.some((a) => a.id === "delete"),
    false,
  );
});

test("draft without schedule omits Agendar", () => {
  const actions = getPostDialogFooterActions({
    ...base,
    status: "draft",
    mode: "edit",
    hasSchedule: false,
  });

  assert.equal(
    actions.some((a) => a.id === "schedule"),
    false,
  );
  assert.equal(actions.at(-1)?.id, "save_draft");
});

test("scheduled footer: delete, Desagendar ghost, Publicar outline, Salvar primary", () => {
  const actions = getPostDialogFooterActions({
    ...base,
    status: "scheduled",
    mode: "edit",
    hasSchedule: true,
  });

  assert.equal(countPrimaryFooterActions(actions), 1);
  assert.deepEqual(
    actions.map((a) => [a.id, a.variant, a.label]),
    [
      ["delete", "ghost", "Deletar"],
      ["revert_to_draft", "ghost", "Desagendar"],
      ["publish_now", "outline", "Publicar agora"],
      ["save_scheduled", "default", "Salvar"],
    ],
  );
  assert.equal(
    actions.some((a) => a.id === "save_draft" || a.id === "schedule"),
    false,
  );
});

test("failed footer: delete + no primary solid", () => {
  const actions = getPostDialogFooterActions({
    ...base,
    status: "failed",
    mode: "edit",
    hasSchedule: true,
  });

  assert.equal(countPrimaryFooterActions(actions), 0);
  assert.equal(actions[0]?.id, "delete");
  assert.deepEqual(
    actions.slice(1).map((a) => a.id),
    ["retry_draft", "retry_schedule"],
  );
});

test("published and monitored have no edit actions", () => {
  for (const status of ["published", "monitored"] as const) {
    const actions = getPostDialogFooterActions({
      ...base,
      status,
      mode: "edit",
      hasSchedule: false,
    });
    assert.deepEqual(actions, []);
  }
});

test("cancelled shows Restaurar rascunho ghost without delete", () => {
  const actions = getPostDialogFooterActions({
    ...base,
    status: "cancelled",
    mode: "edit",
    hasSchedule: false,
  });
  assert.deepEqual(actions, [
    { id: "revert_to_draft", label: "Restaurar rascunho", variant: "ghost" },
  ]);
});
