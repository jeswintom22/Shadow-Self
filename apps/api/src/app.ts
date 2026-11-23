import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { simulationRoutes } from "./routes/simulation.js";
import { createClaudeSimulationService } from "./services/claudeSimulationService.js";
import type { SimulationService } from "./services/simulationService.js";

type BuildAppOptions = {
  logger?: boolean;
  simulationService?: SimulationService;
};

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? true, bodyLimit: 64 * 1024 });
  const simulationService = options.simulationService ?? createClaudeSimulationService();

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()) : true
  });
  await app.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX ?? 10),
    timeWindow: "1 minute",
    allowList: (request) => request.url === "/health"
  });

  app.get("/health", async () => ({ ok: true }));
  await app.register(simulationRoutes, { simulationService });

  return app;
}
