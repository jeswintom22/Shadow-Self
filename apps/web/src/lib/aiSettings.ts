import { SIMULATION_PROVIDERS, type SimulationProvider } from "@shadow-self/shared";

export const AI_SETTINGS_STORAGE_KEY = "shadow-self-ai";

export type AiSettings = {
  provider: SimulationProvider;
  apiKey: string;
  model: string;
};

export const PROVIDER_LABELS: Record<SimulationProvider, string> = {
  anthropic: "Anthropic (Claude)",
  openai: "OpenAI",
  gemini: "Google Gemini",
  grok: "xAI (Grok)"
};

export function isSimulationProvider(value: unknown): value is SimulationProvider {
  return typeof value === "string" && (SIMULATION_PROVIDERS as readonly string[]).includes(value);
}

export function loadAiSettings(): AiSettings {
  const fallback: AiSettings = { provider: "anthropic", apiKey: "", model: "" };
  try {
    const raw = window.localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return fallback;
    }

    const settings = parsed as Partial<AiSettings>;

    return {
      provider: isSimulationProvider(settings.provider) ? settings.provider : "anthropic",
      apiKey: typeof settings.apiKey === "string" ? settings.apiKey : "",
      model: typeof settings.model === "string" ? settings.model : ""
    };
  } catch {
    return fallback;
  }
}

export function saveAiSettings(settings: AiSettings): void {
  try {
    window.localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    return;
  }
}

export function clearAiSettings(): void {
  try {
    window.localStorage.removeItem(AI_SETTINGS_STORAGE_KEY);
  } catch {
    return;
  }
}
