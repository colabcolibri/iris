import type { MessageAgentContent } from "../../ports/message-agent-content-store.ts";

const DEFAULT_MESSAGE_AGENT_CONTENT: Omit<MessageAgentContent, "updatedAt"> = {
  dmSoul: "",
  dmPage: "",
  dmKnowledge: "",
  dmRestrictions: "",
};

export function getMessageAgentContentOrDefault(
  store: { get(): MessageAgentContent | null },
): MessageAgentContent {
  const saved = store.get();
  if (saved) {
    return saved;
  }

  return {
    ...DEFAULT_MESSAGE_AGENT_CONTENT,
    updatedAt: new Date().toISOString(),
  };
}
