import { test } from "node:test";
import assert from "node:assert/strict";
import { generateReply } from "./reply-agent.ts";

test("generateReply uses llm completer", async () => {
  const reply = await generateReply(
    {
      llm: {
        async complete(prompt) {
          assert.match(prompt, /@fan: Adorei!/);
          assert.match(prompt, /Response language \(MANDATORY\)/);
          return "Thanks for your comment!";
        },
      },
      responseLanguage: "en-US",
    },
    {
      caption: "New product",
      commentText: "Adorei!",
      authorUsername: "fan",
    },
  );

  assert.equal(reply, "Thanks for your comment!");
});
