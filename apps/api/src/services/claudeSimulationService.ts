import Anthropic from "@anthropic-ai/sdk";
import {
  NARRATIVE_DEFAULT_MODELS,
  NARRATIVE_SYSTEM_PROMPT,
  PROVIDER_CHAT_URLS,
  calculateProjectionPair,
  createNarrativeUserMessage,
  createTemplateNarrative,
  getLatestLogs,
  invertLog,
  parseNarrativeText,
  simulationVerdictSchema,
  type HabitLog,
  type ProjectionPoint,
  type SimulationNarrative,
  type SimulationProvider
} from "@shadow-self/shared";
import { SimulationProviderError, type SimulationCredentials, type SimulationService } from "./simulationService.js";

type ClaudeTextResponse = {
  content: Array<{
    type: string;
    text?: string;
  }>;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

type SimulationEnv = Record<string, string | undefined>;

function providerEnvName(provider: SimulationProvider, suffix: "API_KEY" | "MODEL"): string {
  return `${provider.toUpperCase()}_${suffix}`;
}

function extractText(response: ClaudeTextResponse): string {
  const text = response.content.find((block) => block.type === "text" && typeof block.text === "string")?.text;

  if (!text) {
    throw new SimulationProviderError("The model returned no text content.");
  }

  return text.trim();
}

function parseNarrative(text: string): SimulationNarrative {
  try {
    return parseNarrativeText(text);
  } catch {
    throw new SimulationProviderError("The model returned invalid narrative JSON.");
  }
}

export function createClaudeSimulationService(env: SimulationEnv = process.env): SimulationService {
  return {
    async run(logs, credentials: SimulationCredentials = {}) {
      const provider = credentials.provider ?? "anthropic";
      const apiKey =
        credentials.apiKey ??
        env[providerEnvName(provider, "API_KEY")] ??
        (provider === "grok" ? env.XAI_API_KEY : undefined);
      const model = credentials.model ?? env[providerEnvName(provider, "MODEL")] ?? NARRATIVE_DEFAULT_MODELS[provider];
      const latestLogs = getLatestLogs(logs, 7);
      const shadowLogs = latestLogs.map(invertLog);
      const projection = calculateProjectionPair(latestLogs);
      let narrative: SimulationNarrative = createTemplateNarrative(latestLogs, projection);
      let source: SimulationProvider | "template" = "template";

      if (apiKey) {
        try {
          narrative = await requestNarrative(
            provider,
            apiKey,
            model,
            latestLogs,
            shadowLogs,
            projection.user,
            projection.shadow
          );
          source = provider;
        } catch (error) {
          console.warn(`Narrative request to ${provider} failed, using template narrative.`, error);
        }
      }

      return simulationVerdictSchema.parse({
        user: projection.user,
        shadow: projection.shadow,
        narrative,
        generatedAt: new Date().toISOString(),
        lastInputDate: latestLogs.at(-1)?.date,
        source
      });
    }
  };
}

async function requestNarrative(
  provider: SimulationProvider,
  apiKey: string,
  model: string,
  userLogs: HabitLog[],
  shadowLogs: HabitLog[],
  userProjection: ProjectionPoint[],
  shadowProjection: ProjectionPoint[]
): Promise<SimulationNarrative> {
  const userMessage = createNarrativeUserMessage(userLogs, shadowLogs, userProjection, shadowProjection);

  if (provider === "anthropic") {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 1200,
      temperature: 0.5,
      system: NARRATIVE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }]
    });

    return parseNarrative(extractText(response));
  }

  const response = await fetch(PROVIDER_CHAT_URLS[provider], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      max_tokens: 1200,
      messages: [
        { role: "system", content: NARRATIVE_SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ]
    })
  });

  if (!response.ok) {
    throw new SimulationProviderError(`${provider} responded with ${response.status}.`);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const text = payload.choices?.[0]?.message?.content;

  if (!text) {
    throw new SimulationProviderError(`${provider} returned no text content.`);
  }

  return parseNarrative(text);
}
