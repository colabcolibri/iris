import type { HarnessTool } from "../../ports/harness-tool.ts";

export class HarnessToolRegistry {
  private readonly tools = new Map<string, HarnessTool>();

  register(tool: HarnessTool): void {
    this.tools.set(tool.name, tool);
  }

  registerAll(tools: HarnessTool[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  get(name: string): HarnessTool | null {
    return this.tools.get(name) ?? null;
  }

  list(): HarnessTool[] {
    return [...this.tools.values()];
  }

  describeForPrompt(): string {
    return this.list()
      .map((tool) => `- ${tool.name}: ${tool.description}`)
      .join("\n");
  }
}
