import { test } from "node:test";
import assert from "node:assert/strict";
import { eventBus, notifyMessagesChanged } from "./event-bus.ts";

test("notifyMessagesChanged broadcasts messages-changed event", () => {
  const frames: string[] = [];
  const mockClient = {
    write(frame: string) {
      frames.push(frame);
    },
    on() {
      return mockClient;
    },
  } as never;

  eventBus.subscribe(mockClient);
  notifyMessagesChanged({ conversation_id: "conv-1" });

  assert.equal(frames.length, 1);
  assert.match(frames[0] ?? "", /event: messages-changed/);
  assert.match(frames[0] ?? "", /conv-1/);
});
