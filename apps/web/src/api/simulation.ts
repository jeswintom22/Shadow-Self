import { simulationVerdictSchema, type HabitLog, type SimulationVerdict } from "@shadow-self/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

export async function runSimulation(logs: HabitLog[]): Promise<SimulationVerdict> {
  const response = await fetch(`${API_BASE_URL}/api/simulation/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ logs })
  });

  const payload: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "The simulation could not be completed.";
    throw new Error(message);
  }

  return simulationVerdictSchema.parse(payload);
}
