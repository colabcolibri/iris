import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { collectOperatorNotificationsFromHarnessSteps } from "./serialize-operator-notification-log.ts";
import type { MessageStageResult } from "../message-harness/types.ts";

describe("collectOperatorNotificationsFromHarnessSteps", () => {
  test("collects notifications from notify_operator tool output", () => {
    const steps: MessageStageResult[] = [
      {
        stage: "message_agentic_draft",
        verdict: "ok",
        reason: "tool",
        reasoning: "escalated",
        structured: {
          turnIndex: 1,
          toolName: "notify_operator",
          toolInput: { reason: "test" },
          toolOutput: {
            escalated: true,
            notifications: [
              {
                id: "log-1",
                event_type: "operator_attention_required",
                channel: "email",
                status: "sent",
                payload_summary: "urgency=high",
                recipient: "ops@example.com",
                error_message: null,
                created_at: "2026-08-14T12:00:00.000Z",
              },
            ],
          },
        },
      },
    ];

    const items = collectOperatorNotificationsFromHarnessSteps(steps);
    assert.equal(items.length, 1);
    assert.equal(items[0]?.status, "sent");
    assert.equal(items[0]?.recipient, "ops@example.com");
  });

  test("returns empty when notify_operator was not called", () => {
    const items = collectOperatorNotificationsFromHarnessSteps([]);
    assert.deepEqual(items, []);
  });
});
