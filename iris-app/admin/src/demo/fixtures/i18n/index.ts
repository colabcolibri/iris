export type { DemoSimulateCanned } from "./simulator.en";
export { getDemoCommentThreadBundle } from "../demo-comment-threads";
export { getDemoReplyPersona, getDemoAgentContent } from "../persona";
export {
  getDemoWebhookEvents,
  getDemoAgentRuns,
  getDemoAgentRunDetails,
} from "../settings";
export { getDemoSimulateCanned } from "../simulator";

import type { DemoLocale } from "@/demo/locale";
import {
  DEMO_POST_TEMPLATES,
  type DemoPostTemplate,
} from "../demo-post-templates";
import { DEMO_POST_COPY_EN } from "./post-copy.en";

export function getDemoPostTemplates(locale: DemoLocale): DemoPostTemplate[] {
  if (locale !== "en") return DEMO_POST_TEMPLATES;

  return DEMO_POST_TEMPLATES.map((template) => {
    const copy = DEMO_POST_COPY_EN[template.id];
    if (!copy) return template;

    const merged: DemoPostTemplate = { ...template };
    if (copy.caption != null) merged.caption = copy.caption;
    if (copy.carousel_summary != null) {
      merged.carousel_summary = copy.carousel_summary;
    }
    if (copy.reply_prompt != null) merged.reply_prompt = copy.reply_prompt;
    if (copy.assets && template.assets) {
      merged.assets = template.assets.map((asset) => {
        const overlay = copy.assets?.find(
          (entry) => entry.filename === asset.filename,
        );
        return overlay?.alt_text
          ? { ...asset, alt_text: overlay.alt_text }
          : asset;
      });
    }
    return merged;
  });
}
