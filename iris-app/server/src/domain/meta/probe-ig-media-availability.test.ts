import { test } from "node:test";
import assert from "node:assert/strict";
import { probeIgMediaAvailability } from "./probe-ig-media-availability.ts";

test("probeIgMediaAvailability marca indisponível quando a Meta não retorna a mídia", async () => {
  const result = await probeIgMediaAvailability(
    {
      async fetchMediaMetadata() {
        throw new Error(
          "Unsupported get request. Object with ID '18605068429042135' does not exist",
        );
      },
      async isMediaOnUserFeed() {
        return false;
      },
      async canAccessMediaComments() {
        return false;
      },
    },
    "18605068429042135",
  );

  assert.equal(result.status, "unavailable");
  assert.match(result.detail ?? "", /não existe mais no Instagram/i);
});

test("probeIgMediaAvailability marca arquivada quando metadados falham mas comentários respondem", async () => {
  const result = await probeIgMediaAvailability(
    {
      async fetchMediaMetadata() {
        throw new Error(
          "Unsupported get request. Object with ID '18605068429042135' does not exist",
        );
      },
      async isMediaOnUserFeed() {
        return false;
      },
      async canAccessMediaComments() {
        return true;
      },
    },
    "18605068429042135",
  );

  assert.equal(result.status, "archived");
  assert.match(result.detail ?? "", /arquivada/i);
});

test("probeIgMediaAvailability marca arquivada quando existe mas não está no feed", async () => {
  const result = await probeIgMediaAvailability(
    {
      async fetchMediaMetadata(igMediaId) {
        return {
          igMediaId,
          caption: "legenda",
          timestamp: "2026-08-10T10:00:00.000Z",
        };
      },
      async isMediaOnUserFeed() {
        return false;
      },
      async canAccessMediaComments() {
        return false;
      },
    },
    "media-archived",
  );

  assert.equal(result.status, "archived");
  assert.match(result.detail ?? "", /arquivada/i);
});

test("probeIgMediaAvailability marca on_feed quando a mídia está listada", async () => {
  const result = await probeIgMediaAvailability(
    {
      async fetchMediaMetadata(igMediaId) {
        return {
          igMediaId,
          caption: null,
          timestamp: null,
        };
      },
      async isMediaOnUserFeed() {
        return true;
      },
      async canAccessMediaComments() {
        return true;
      },
    },
    "media-feed",
  );

  assert.equal(result.status, "on_feed");
  assert.equal(result.detail, null);
});
