import {
  HABITS,
  SCORE_AXES,
  simulationNarrativeSchema,
  sortLogsOldestFirst,
  type HabitLog,
  type ProjectionPoint,
  type ScoreAxis,
  type SimulationNarrative,
  type SimulationProvider
} from "./habitTypes.js";
import { calculateDominantNegativeHabits } from "./analysis.js";

export const NARRATIVE_SYSTEM_PROMPT = [
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

export const PROVIDER_CHAT_URLS: Record<SimulationProvider, string> = {
  anthropic: "https://api.anthropic.com/v1/messages",
  openai: "https://api.openai.com/v1/chat/completions",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  grok: "https://api.x.ai/v1/chat/completions"
};

export const NARRATIVE_DEFAULT_MODELS: Record<SimulationProvider, string> = {
  anthropic: "claude-sonnet-4-5",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.5-flash",
  grok: "grok-3-mini"
};

export function createNarrativeUserMessage(
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

export function parseNarrativeText(text: string): SimulationNarrative {
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  return simulationNarrativeSchema.parse(JSON.parse(cleaned));
}

function describePath(points: ProjectionPoint[]): string {
  const first = points[0];
  const last = points.at(-1) ?? first;
  const parts = SCORE_AXES.map((axis: ScoreAxis) => {
    const delta = Math.round(last[axis] - first[axis]);
    const trend = delta > 2 ? "rises" : delta < -2 ? "falls" : "holds steady";
    return `${axis} ${trend} to ${Math.round(last[axis])}`;
  });
  return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)} by day ${last.day}`;
}

export function createTemplateNarrative(
  logs: HabitLog[],
  projection: { user: ProjectionPoint[]; shadow: ProjectionPoint[] }
): SimulationNarrative {
  const latest = logs.at(-1);
  const drivers = latest
    ? [...new Set(Object.values(calculateDominantNegativeHabits(latest)))].map((key) => HABITS[key].name.toLowerCase())
    : [];
  const userEnd = projection.user.at(-1);
  const shadowEnd = projection.shadow.at(-1);
  const total = (p?: ProjectionPoint) => (p ? p.energy + p.focus + p.mood : 0);
  const gap = Math.round((total(shadowEnd) - total(userEnd)) / 3);

  return {
    user: `If your recent habits continue, your ${describePath(projection.user)}.`,
    shadow: `Your Shadow follows the opposite habits: its ${describePath(projection.shadow)}.`,
    comparison:
      gap === 0
        ? "Both paths end in roughly the same place."
        : `By day 30 the ${gap > 0 ? "Shadow is ahead" : "you are ahead"} by about ${Math.abs(gap)} points on average${
            drivers.length ? `, mostly because of ${drivers.join(", ")}` : ""
          }.`
  };
}
