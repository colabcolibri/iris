import { test } from "node:test";
import assert from "node:assert/strict";
import {
  barrierReplyMeetsRequirements,
  ensureAuthorMention,
  isSafetyBarrierKind,
  usesBrazilCrisisResources,
} from "./safety-barrier-policy.ts";

test("usesBrazilCrisisResources only for pt-BR config", () => {
  assert.equal(usesBrazilCrisisResources("pt-BR"), true);
  assert.equal(usesBrazilCrisisResources("pt"), true);
  assert.equal(usesBrazilCrisisResources("pt-PT"), false);
  assert.equal(usesBrazilCrisisResources("en-US"), false);
  assert.equal(usesBrazilCrisisResources("es"), false);
});

test("isSafetyBarrierKind", () => {
  assert.equal(isSafetyBarrierKind("crisis"), true);
  assert.equal(isSafetyBarrierKind("hate_violence"), true);
  assert.equal(isSafetyBarrierKind("harmful"), false);
});

test("ensureAuthorMention prefixes once", () => {
  assert.equal(ensureAuthorMention("Olá", "maria"), "@maria Olá");
  assert.equal(ensureAuthorMention("@maria Olá", "maria"), "@maria Olá");
});

test("barrierReplyMeetsRequirements checks facts not templates", () => {
  assert.equal(
    barrierReplyMeetsRequirements(
      "crisis",
      "pt-BR",
      "Procure o CVV no Brasil pelo 188 se precisar.",
    ),
    true,
  );
  assert.equal(
    barrierReplyMeetsRequirements("crisis", "pt-BR", "Fica bem, respira."),
    false,
  );
  assert.equal(
    barrierReplyMeetsRequirements(
      "crisis",
      "en-US",
      "Please contact a local crisis hotline now.",
    ),
    true,
  );
  assert.equal(
    barrierReplyMeetsRequirements(
      "crisis",
      "pt-PT",
      "@ana Sinto muito. Em Portugal pode ligar SNS24 — não precisa passar por isso sozinha.",
    ),
    true,
  );
  assert.equal(
    barrierReplyMeetsRequirements(
      "hate_violence",
      "pt-BR",
      "Como assistente virtual, não entro em ódio ou violência.",
    ),
    true,
  );
});
