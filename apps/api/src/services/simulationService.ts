import type { HabitLog, SimulationProvider, SimulationVerdict } from "@shadow-self/shared";

export type SimulationCredentials = {
  provider?: SimulationProvider;
  apiKey?: string;
  model?: string;
};

export type SimulationService = {
  run(logs: HabitLog[], credentials?: SimulationCredentials): Promise<SimulationVerdict>;
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
