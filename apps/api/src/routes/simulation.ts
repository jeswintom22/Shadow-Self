import { getLatestLogs, simulationRequestSchema } from "@shadow-self/shared";
import type { FastifyPluginAsync } from "fastify";
import {
  SimulationProviderError,
  SimulationSetupError,
  type SimulationService
} from "../services/simulationService.js";

type SimulationRoutesOptions = {
  simulationService: SimulationService;
};

export const simulationRoutes: FastifyPluginAsync<SimulationRoutesOptions> = async (fastify, options) => {
  fastify.post("/api/simulation/run", async (request, reply) => {
    const parsed = simulationRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid simulation request",
        issues: parsed.error.issues
      });
    }

    const logs = getLatestLogs(parsed.data.logs, 7);

    if (logs.length < 7) {
      return reply.status(400).send({
        error: "Seven logged days are required to run a simulation."
      });
    }

    try {
      return await options.simulationService.run(logs, {
        provider: parsed.data.provider,
        apiKey: parsed.data.apiKey,
        model: parsed.data.model
      });
    } catch (error) {
      if (error instanceof SimulationSetupError) {
        return reply.status(503).send({
          error: error.message
        });
      }

      if (error instanceof SimulationProviderError) {
        return reply.status(502).send({
          error: error.message,
          retryable: true
        });
      }

      request.log.error(error);

      return reply.status(502).send({
        error: "The simulation provider failed.",
        retryable: true
      });
    }
  });
};
