import type { HabitLog, SimulationVerdict } from "@shadow-self/shared";

export type SimulationService = {
  run(logs: HabitLog[]): Promise<SimulationVerdict>;
};

export class SimulationSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimulationSetupError";
  }
}

export class SimulationProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimulationProviderError";
  }
}
