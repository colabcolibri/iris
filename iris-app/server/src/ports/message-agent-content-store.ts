export type MessageAgentContent = {
  dmSoul: string;
  dmPage: string;
  dmKnowledge: string;
  dmRestrictions: string;
  updatedAt: string;
};

export type MessageAgentContentStore = {
  get(): MessageAgentContent | null;
  upsert(
    input: Omit<MessageAgentContent, "updatedAt"> & { updatedAt?: string },
  ): MessageAgentContent;
};
