import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isConversationOwnerParticipant,
  pickConversationParticipant,
} from "./remote-message-utils.ts";

test("pickConversationParticipant excludes owner by ig user id", () => {
  const participants = [
    { id: "ig-page", username: "colibri", name: "Colibri", profilePicUrl: null },
    { id: "user-1", username: "cliente", name: "Cliente", profilePicUrl: null },
  ];

  const picked = pickConversationParticipant(participants, "ig-page");
  assert.equal(picked?.id, "user-1");
  assert.equal(picked?.username, "cliente");
});

test("pickConversationParticipant excludes owner by username when ids differ", () => {
  const participants = [
    { id: "ig-page", username: "colibri", name: "Colibri", profilePicUrl: null },
    { id: "user-1", username: "cliente", name: "Cliente", profilePicUrl: null },
  ];

  const picked = pickConversationParticipant(participants, null, "colibri");
  assert.equal(picked?.id, "user-1");
});

test("pickConversationParticipant returns null when only owner is present", () => {
  const participants = [
    { id: "ig-page", username: "colibri", name: "Colibri", profilePicUrl: null },
  ];

  assert.equal(pickConversationParticipant(participants, "ig-page"), null);
});

test("isConversationOwnerParticipant matches username case-insensitively", () => {
  const owner = { id: "x", username: "@Colibri", name: null, profilePicUrl: null };
  assert.equal(isConversationOwnerParticipant(owner, null, "colibri"), true);
});
