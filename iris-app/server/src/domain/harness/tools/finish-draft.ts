import type { HarnessTool } from "../../../ports/harness-tool.ts";

export function createFinishDraftTool(): HarnessTool {
  return {
    name: "finish_draft",
    description: "Finalize the DM draft loop with the reply text sent to the customer.",
    async execute(_ctx, args) {
      const text = typeof args.text === "string" ? args.text.trim() : "";
      if (!text) {
        return { success: false, output: null, errorCode: "empty_text" };
      }
      return { success: true, output: { text } };
    },
  };
}
