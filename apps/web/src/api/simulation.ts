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
  type SimulationNarrative,
  type SimulationProvider,
  type SimulationVerdict
} from "@shadow-self/shared";
import { loadAiSettings } from "../lib/aiSettings.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

async function requestAnthropicNarrative(
  apiKey: string,
  model: string,
  userMessage: string
): Promise<string> {
  const response = await fetch(PROVIDER_CHAT_URLS.anthropic, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      temperature: 0.5,
      system: NARRATIVE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }]
    })
  });

  if (!response.ok) {
    throw new Error(`anthropic responded with ${response.status}`);
  }

  const payload = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = payload.content?.find((block) => block.type === "text")?.text;

  if (!text) {
    throw new Error("anthropic returned no text content");
  }

  return text;
}

async function requestOpenAiStyleNarrative(
  provider: Exclude<SimulationProvider, "anthropic">,
  apiKey: string,
  model: string,
  userMessage: string
): Promise<string> {
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
    throw new Error(`${provider} responded with ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const text = payload.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error(`${provider} returned no text content`);
  }

  return text;
}

async function requestBrowserNarrative(
  provider: SimulationProvider,
  apiKey: string,
  model: string | undefined,
  userLogs: HabitLog[],
  shadowLogs: HabitLog[],
  projection: { user: { day: number; energy: number; focus: number; mood: number }[]; shadow: { day: number; energy: number; focus: number; mood: number }[] }
): Promise<SimulationNarrative> {
  const modelName = model ?? NARRATIVE_DEFAULT_MODELS[provider];
  const userMessage = createNarrativeUserMessage(userLogs, shadowLogs, projection.user, projection.shadow);
  const text =
    provider === "anthropic"
      ? await requestAnthropicNarrative(apiKey, modelName, userMessage)
      : await requestOpenAiStyleNarrative(provider, apiKey, modelName, userMessage);

  return parseNarrativeText(text);
}

async function requestServerSimulation(logs: HabitLog[]): Promise<SimulationVerdict> {
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

export async function runSimulation(logs: HabitLog[]): Promise<SimulationVerdict> {
  const latestLogs = getLatestLogs(logs, 7);
  const projection = calculateProjectionPair(latestLogs);
  const ai = loadAiSettings();

  if (ai.apiKey) {
    try {
      const narrative = await requestBrowserNarrative(
        ai.provider,
        ai.apiKey,
        ai.model || undefined,
        latestLogs,
        latestLogs.map(invertLog),
        projection
      );

      return simulationVerdictSchema.parse({
        user: projection.user,
        shadow: projection.shadow,
        narrative,
        generatedAt: new Date().toISOString(),
        lastInputDate: latestLogs.at(-1)?.date,
        source: ai.provider
      });
    } catch (error) {
      console.warn("Browser narrative request failed, trying the API fallback.", error);
    }
  }

  try {
    return await requestServerSimulation(latestLogs);
  } catch (error) {
    console.warn("Simulation API unavailable, using built-in summary.", error);
  }

  return simulationVerdictSchema.parse({
    user: projection.user,
    shadow: projection.shadow,
    narrative: createTemplateNarrative(latestLogs, projection),
    generatedAt: new Date().toISOString(),
    lastInputDate: latestLogs.at(-1)?.date,
    source: "template"
  });
}
