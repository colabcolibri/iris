export type AgentContent = {
  soul: string;
  page: string;
  knowledge: string;
  restrictions: string;
  updatedAt: string;
};

export type AgentContentInput = Omit<AgentContent, "updatedAt">;

export type AgentContentStore = {
  get(): AgentContent | null;
  upsert(input: AgentContentInput): AgentContent;
};
