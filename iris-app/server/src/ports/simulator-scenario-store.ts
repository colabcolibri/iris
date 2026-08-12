import type {
  SimulatorScenario,
  SimulatorScenarioInput,
} from "../domain/agent-simulator/simulator-scenario.ts";

export type { SimulatorScenario, SimulatorScenarioInput };

export type SimulatorScenarioStore = {
  list(): SimulatorScenario[];
  getById(id: string): SimulatorScenario | null;
  create(input: SimulatorScenarioInput): SimulatorScenario;
  update(id: string, input: SimulatorScenarioInput): SimulatorScenario | null;
  delete(id: string): boolean;
};
