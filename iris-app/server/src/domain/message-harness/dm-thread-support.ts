import type { MessageReplyContext } from "../message-reply-context/types.ts";

function normalizeComparableText(text: string): string {
  return text
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[!?.,…~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenOverlapRatio(a: string, b: string): number {
  const tokensA = new Set(normalizeComparableText(a).split(" ").filter(Boolean));
  const tokensB = new Set(normalizeComparableText(b).split(" ").filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) {
    return 0;
  }
  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      overlap += 1;
    }
  }
  return overlap / Math.max(tokensA.size, tokensB.size);
}

export function findSimilarPriorBrandReply(
  context: MessageReplyContext,
  candidateText: string,
  threshold = 0.72,
): string | null {
  const normalizedCandidate = normalizeComparableText(candidateText);
  if (!normalizedCandidate) {
    return null;
  }

  const outbound = context.thread.entries.filter((entry) => entry.direction === "outbound");
  for (let index = outbound.length - 1; index >= 0; index -= 1) {
    const prior = outbound[index]?.text ?? "";
    if (!prior.trim()) {
      continue;
    }
    if (normalizeComparableText(prior) === normalizedCandidate) {
      return prior;
    }
    if (tokenOverlapRatio(prior, candidateText) >= threshold) {
      return prior;
    }
  }

  return null;
}

export function customerStillReportingDifficulty(context: MessageReplyContext): boolean {
  const target = context.targetMessage.text ?? "";
  return /\b(?:ainda|não|nao|problema|erro|não consigo|nao consigo|pedido|compra)\b/iu.test(
    target,
  );
}
