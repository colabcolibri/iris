import { test } from "node:test";
import assert from "node:assert/strict";
import { generateReply } from "./reply-agent.ts";

test("generateReply uses llm completer", async () => {
  const reply = await generateReply(
    {
      llm: {
        async complete(prompt) {
          assert.match(prompt, /Comentário de @fan/);
          return "Obrigado pelo comentário!";
        },
      },
      tone: "casual",
    },
    {
      caption: "Novo produto",
      commentText: "Adorei!",
      authorUsername: "fan",
    },
  );

  assert.equal(reply, "Obrigado pelo comentário!");
});
