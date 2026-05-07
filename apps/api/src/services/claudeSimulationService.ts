import Anthropic from "@anthropic-ai/sdk";
import {
  getLatestLogs,
  invertLog,
  projectionPointSchema,
  simulationNarrativeSchema,
  simulationVerdictSchema,
  sortLogsOldestFirst,
  type HabitLog,
  type ProjectionPoint,
  type SimulationNarrative
} from "@shadow-self/shared";
import { z } from "zod";
import { SimulationProviderError, SimulationSetupError, type SimulationService } from "./simulationService.js";

const projectionSchema = z
  .array(projectionPointSchema)
  .length(30)
  .refine((points) => points.every((point, index) => point.day === index + 1), {
    message: "Projection days must be numbered 1 through 30."
  });

const PROJECTION_SYSTEM_PROMPT = [
  "You are a habit simulation engine.",
  "Given seven days of habit data for one person, project their energy, focus, and mood scores for thirty days.",
  "Return valid JSON only, with no preamble and no markdown fences.",
  "The JSON must be an array of 30 objects.",
  "Each object must contain day, energy, focus, and mood.",
  "day must be 1 through 30. energy, focus, and mood must be integers from 0 to 100.",
  "Scores should reflect plausible compounding effects: good sleep compounds into better focus over time, and sustained screen time compounds into worse mood."
].join(" ");

const NARRATIVE_SYSTEM_PROMPT = [
  "You are an observational, non-judgmental habit projection writer.",
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

function createProjectionUserMessage(logs: HabitLog[]): string {
  return JSON.stringify(
    {
      logs: sortLogsOldestFirst(logs)
    },
    null,
    2
  );
}

function createNarrativeUserMessage(
  userLogs: HabitLog[],
  shadowLogs: HabitLog[],
  userProjection: ProjectionPoint[],
  shadowProjection: ProjectionPoint[]
): string {
  return JSON.stringify(
    {
      userLogs,
      shadowLogs,
      userProjection,
      shadowProjection
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

      const userProjection = await requestProjection(client, model, latestLogs);
      const shadowProjection = await requestProjection(client, model, shadowLogs);
      const narrative = await requestNarrative(client, model, latestLogs, shadowLogs, userProjection, shadowProjection);

      return simulationVerdictSchema.parse({
        user: userProjection,
        shadow: shadowProjection,
        narrative,
        generatedAt: new Date().toISOString(),
        lastInputDate: latestLogs.at(-1)?.date
      });
    }
  };
}

async function requestProjection(
  client: Anthropic,
  model: string,
  logs: HabitLog[]
): Promise<ProjectionPoint[]> {
  const response = await client.messages.create({
    model,
    max_tokens: 4000,
    temperature: 0.3,
    system: PROJECTION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: createProjectionUserMessage(logs) }]
  });

  return parseJson(extractText(response), projectionSchema, "projection");
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
