import Anthropic from "@anthropic-ai/sdk";
import {
  calculateProjectionPair,
  getLatestLogs,
  invertLog,
  simulationNarrativeSchema,
  simulationVerdictSchema,
  sortLogsOldestFirst,
  type HabitLog,
  type ProjectionPoint,
  type SimulationNarrative
} from "@shadow-self/shared";
import type { z } from "zod";
import { SimulationProviderError, SimulationSetupError, type SimulationService } from "./simulationService.js";

const NARRATIVE_SYSTEM_PROMPT = [
  "You are an observational, non-judgmental habit projection writer.",
  "You are not a simulation engine.",
  "The projection scores are deterministic and final.",
  "Never invent, alter, smooth, extrapolate, or replace score values.",
  "If you mention a number, it must come directly from the provided projections.",
  "Return valid JSON only, with no preamble and no markdown fences.",
  "The JSON object must have user, shadow, and comparison string fields.",
  "Write three short paragraphs: one about the user's projected path, one about the Shadow's projected path, and one comparing them.",
  "Mention specific habits by name when they drive the divergence. Do not lecture."
].join(" ");

type ClaudeTextResponse = {
  content: Array<{
    type: string;
    text?: string;
  }>;
};

type ClaudeSimulationEnv = {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
};

function extractText(response: ClaudeTextResponse): string {
  const text = response.content.find((block) => block.type === "text" && typeof block.text === "string")?.text;

  if (!text) {
    throw new SimulationProviderError("Claude returned no text content.");
  }

  return text.trim();
}

function parseJson<T>(text: string, schema: z.ZodType<T>, label: string): T {
  try {
    return schema.parse(JSON.parse(text));
  } catch {
    throw new SimulationProviderError(`Claude returned invalid ${label} JSON.`);
  }
}

function createNarrativeUserMessage(
  userLogs: HabitLog[],
  shadowLogs: HabitLog[],
  userProjection: ProjectionPoint[],
  shadowProjection: ProjectionPoint[]
): string {
  return JSON.stringify(
    {
      instruction: "Interpret these deterministic projections. Do not create or modify any scores.",
      userLogs: sortLogsOldestFirst(userLogs),
      shadowLogs: sortLogsOldestFirst(shadowLogs),
      projections: {
        user: userProjection,
        shadow: shadowProjection
      }
    },
    null,
    2
  );
}

export function createClaudeSimulationService(env: ClaudeSimulationEnv = process.env): SimulationService {
  return {
    async run(logs) {
      const apiKey = env.ANTHROPIC_API_KEY;
      const model = env.ANTHROPIC_MODEL;

      if (!apiKey || !model) {
        throw new SimulationSetupError("ANTHROPIC_API_KEY and ANTHROPIC_MODEL are required to run simulations.");
      }

      const latestLogs = getLatestLogs(logs, 7);
      const shadowLogs = latestLogs.map(invertLog);
      const client = new Anthropic({ apiKey });
      const projection = calculateProjectionPair(latestLogs);

      const narrative = await requestNarrative(
        client,
        model,
        latestLogs,
        shadowLogs,
        projection.user,
        projection.shadow
      );

      return simulationVerdictSchema.parse({
        user: projection.user,
        shadow: projection.shadow,
        narrative,
        generatedAt: new Date().toISOString(),
        lastInputDate: latestLogs.at(-1)?.date
      });
    }
  };
}

async function requestNarrative(
  client: Anthropic,
  model: string,
  userLogs: HabitLog[],
  shadowLogs: HabitLog[],
  userProjection: ProjectionPoint[],
  shadowProjection: ProjectionPoint[]
): Promise<SimulationNarrative> {
  const response = await client.messages.create({
    model,
    max_tokens: 1200,
    temperature: 0.5,
    system: NARRATIVE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: createNarrativeUserMessage(userLogs, shadowLogs, userProjection, shadowProjection)
      }
    ]
  });

  return parseJson(extractText(response), simulationNarrativeSchema, "narrative");
}
