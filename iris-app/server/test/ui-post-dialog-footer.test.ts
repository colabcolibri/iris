import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const adminPosts = join(import.meta.dirname, "../../admin/src/components/posts");

test("post dialog uses footer actions helper and size sm", () => {
  const dialog = readFileSync(join(adminPosts, "post-dialog.tsx"), "utf8");
  assert.match(dialog, /getPostDialogFooterActions/);
  assert.match(dialog, /save_scheduled: onSchedule/);
  assert.match(dialog, /onDelete/);
  assert.match(dialog, /size="sm"/);
  assert.doesNotMatch(dialog, /Atualizar agendamento/);
  assert.doesNotMatch(dialog, /Salvar alterações/);
  assert.doesNotMatch(dialog, />Fechar</);
});

test("confirm dialog compares phrases case-insensitively and shows lowercase", () => {
  const confirm = readFileSync(
    join(import.meta.dirname, "../../admin/src/components/templates/confirm-dialog.tsx"),
    "utf8",
  );
  assert.match(confirm, /toLocaleLowerCase/);
  assert.match(confirm, /normalizeConfirmPhrase/);
});
