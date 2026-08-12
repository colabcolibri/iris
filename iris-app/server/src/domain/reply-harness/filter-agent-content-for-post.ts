import type { AgentContent } from "../../ports/agent-content-store.ts";

export type PostSilenceFlags = {
  silenceSoul: boolean;
  silencePage: boolean;
  silenceKnowledge: boolean;
  silenceRestrictions: boolean;
};

export function filterAgentContentForPost(
  agentContent: AgentContent,
  flags: PostSilenceFlags,
): AgentContent {
  return {
    ...agentContent,
    soul: flags.silenceSoul ? "" : agentContent.soul,
    page: flags.silencePage ? "" : agentContent.page,
    knowledge: flags.silenceKnowledge ? "" : agentContent.knowledge,
    restrictions: flags.silenceRestrictions ? "" : agentContent.restrictions,
  };
}
