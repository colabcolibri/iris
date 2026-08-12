import { DEMO_STORE_URL } from "@/demo/demo-brand";

export type DemoSimulateCanned = {
  summary: string;
  final_text: string;
  triage_reasoning: string;
  draft_reasoning: string;
  verify_reasoning: string;
};

export function getDemoSimulateCannedEn(): Record<string, DemoSimulateCanned> {
  return {
    "lookbook-verao": {
      summary: "Sand linen dress S restock with link to the store.",
      final_text: `Hi! Yes — we're restocking S of the sand linen dress this Thursday 🙌 Meanwhile you can reserve via the bio link (${DEMO_STORE_URL}) and we'll DM when it's in. Any size questions, we're here with the carousel guide.
Team Estúdio Nômade 💛`,
      triage_reasoning:
        "Comment about product or store — within editorial scope.",
      draft_reasoning:
        "Estúdio Nômade tone: warm, clear, store CTA when relevant.",
      verify_reasoning: "Pre-approved response for demonstration.",
    },
    "reel-styling": {
      summary: "South delivery timing + store experience reinforcement.",
      final_text: `So glad you loved the packaging! 💛 For the south, average timing is 5–8 business days after payment clears. To track open orders, use the customer area at ${DEMO_STORE_URL} — you'll also see Nômade bag news and the capsule collection there.
Team Estúdio Nômade`,
      triage_reasoning:
        "Comment about product or store — within editorial scope.",
      draft_reasoning:
        "Estúdio Nômade tone: warm, clear, store CTA when relevant.",
      verify_reasoning: "Pre-approved response for demonstration.",
    },
  };
}
