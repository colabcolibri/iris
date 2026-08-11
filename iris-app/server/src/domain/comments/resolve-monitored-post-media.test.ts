import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveMonitoredPostMedia } from "./resolve-monitored-post-media.ts";
import { ValidationError } from "../../api/json.ts";

test("resolveMonitoredPostMedia prefers permalink lookup", async () => {
  const metadata = await resolveMonitoredPostMedia(
    {
      igMediaId: null,
      permalink: "https://www.instagram.com/p/Db21fkYDGKE/",
    },
    {
      async listRecentMediaWithComments() {
        return [];
      },
      async fetchMediaMetadata() {
        throw new Error("should not fetch by decoded shortcode id");
      },
      async findMediaByPermalink(permalink) {
        assert.equal(permalink, "https://www.instagram.com/p/Db21fkYDGKE/");
        return {
          igMediaId: "17986333005010731",
          caption: "Legenda",
          timestamp: "2026-08-10T10:00:00.000Z",
        };
      },
    },
  );

  assert.equal(metadata.igMediaId, "17986333005010731");
});

test("resolveMonitoredPostMedia falls back to numeric ig_media_id", async () => {
  const metadata = await resolveMonitoredPostMedia(
    { igMediaId: "17986333005010731", permalink: null },
    {
      async listRecentMediaWithComments() {
        return [];
      },
      async fetchMediaMetadata(igMediaId) {
        return {
          igMediaId,
          caption: "Legenda",
          timestamp: "2026-08-10T10:00:00.000Z",
        };
      },
      async findMediaByPermalink() {
        return null;
      },
    },
  );

  assert.equal(metadata.igMediaId, "17986333005010731");
});

test("resolveMonitoredPostMedia rejects unknown permalink", async () => {
  await assert.rejects(
    () =>
      resolveMonitoredPostMedia(
        {
          igMediaId: null,
          permalink: "https://www.instagram.com/p/unknown/",
        },
        {
          async listRecentMediaWithComments() {
            return [];
          },
          async fetchMediaMetadata() {
            throw new Error("not found");
          },
          async findMediaByPermalink() {
            return null;
          },
        },
      ),
    ValidationError,
  );
});
