import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { simulationRoutes } from "./routes/simulation.js";
import { createClaudeSimulationService } from "./services/claudeSimulationService.js";
import type { SimulationService } from "./services/simulationService.js";

type BuildAppOptions = {
  logger?: boolean;
  simulationService?: SimulationService;
};

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? true });
  const simulationService = options.simulationService ?? createClaudeSimulationService();

  await app.register(cors, {
    origin: true
  });

  app.get("/health", async () => ({ ok: true }));
  await app.register(simulationRoutes, { simulationService });

  return app;
}
