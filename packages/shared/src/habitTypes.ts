import { z } from "zod";

export const SCORE_AXES = ["energy", "focus", "mood"] as const;
export type ScoreAxis = (typeof SCORE_AXES)[number];

export const HABIT_KEYS = ["sleep", "exercise", "water", "screen_time", "social"] as const;
export type HabitKey = (typeof HABIT_KEYS)[number];

export type Scores = Record<ScoreAxis, number>;
export type HabitValues = Record<HabitKey, number>;

export type HabitLog = HabitValues & {
  date: string;
};

export type HabitDefinition = {
  key: HabitKey;
  name: string;
  icon: string;
  target: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  unitPlural: string;
  inverted: boolean;
  weights: Scores;
};

export type ProjectionPoint = {
  day: number;
  energy: number;
  focus: number;
  mood: number;
};

export type SimulationNarrative = {
  user: string;
  shadow: string;
  comparison: string;
};

export type SimulationVerdict = {
  user: ProjectionPoint[];
  shadow: ProjectionPoint[];
  narrative: SimulationNarrative;
  generatedAt: string;
  lastInputDate: string;
  source?: "claude" | "template";
};

export const HABITS = {
  sleep: {
    key: "sleep",
    name: "Sleep",
    icon: "Moon",
    target: 8,
    min: 0,
    max: 12,
    step: 0.5,
    unit: "hr",
    unitPlural: "hrs",
    inverted: false,
    weights: { energy: 0.45, focus: 0.25, mood: 0.2 }
  },
  exercise: {
    key: "exercise",
    name: "Exercise",
    icon: "Dumbbell",
    target: 30,
    min: 0,
    max: 120,
    step: 5,
    unit: "min",
    unitPlural: "min",
    inverted: false,
    weights: { energy: 0.25, focus: 0.3, mood: 0.3 }
  },
  water: {
    key: "water",
    name: "Water",
    icon: "Droplets",
    target: 8,
    min: 0,
    max: 16,
    step: 1,
    unit: "glass",
    unitPlural: "glasses",
    inverted: false,
    weights: { energy: 0.15, focus: 0.15, mood: 0.15 }
  },
  screen_time: {
    key: "screen_time",
    name: "Screen time",
    icon: "MonitorSmartphone",
    target: 2,
    min: 0,
    max: 12,
    step: 0.5,
    unit: "hr",
    unitPlural: "hrs",
    inverted: true,
    weights: { energy: 0.05, focus: 0.2, mood: 0.15 }
  },
  social: {
    key: "social",
    name: "Social time",
    icon: "Users",
    target: 1,
    min: 0,
    max: 8,
    step: 0.5,
    unit: "hr",
    unitPlural: "hrs",
    inverted: false,
    weights: { energy: 0.1, focus: 0.1, mood: 0.2 }
  }
} as const satisfies Record<HabitKey, HabitDefinition>;

export const DEFAULT_TODAY: HabitValues = {
  sleep: 8,
  exercise: 30,
  water: 8,
  screen_time: 2,
  social: 1
};

const numberForHabit = (key: HabitKey) => {
  const habit = HABITS[key];
  let schema = z.number().min(habit.min).max(habit.max);
  if (habit.step === 1) {
    schema = schema.int();
  }
  return schema;
};

export const habitLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sleep: numberForHabit("sleep"),
  exercise: numberForHabit("exercise"),
  water: numberForHabit("water"),
  screen_time: numberForHabit("screen_time"),
  social: numberForHabit("social")
});

export const habitValuesSchema = habitLogSchema.omit({ date: true });

const scoreValueSchema = z.number().min(0).max(100);

export const scoresSchema = z.object({
  energy: scoreValueSchema,
  focus: scoreValueSchema,
  mood: scoreValueSchema
});

export const projectionPointSchema = z.object({
  day: z.number().int().min(1).max(30),
  energy: z.number().int().min(0).max(100),
  focus: z.number().int().min(0).max(100),
  mood: z.number().int().min(0).max(100)
});

export const simulationNarrativeSchema = z.object({
  user: z.string().min(1),
  shadow: z.string().min(1),
  comparison: z.string().min(1)
});

export const simulationVerdictSchema = z.object({
  user: z.array(projectionPointSchema).length(30),
  shadow: z.array(projectionPointSchema).length(30),
  narrative: simulationNarrativeSchema,
  generatedAt: z.string().min(1),
  lastInputDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.enum(["claude", "template"]).optional()
});

export const simulationRequestSchema = z.object({
  logs: z.array(habitLogSchema).min(1)
});

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundToStep(value: number, step: number): number {
  const precision = step.toString().includes(".") ? step.toString().split(".")[1].length : 0;
  return Number((Math.round(value / step) * step).toFixed(precision));
}

export function invertHabit(key: HabitKey, userValue: number): number {
  const habit = HABITS[key];
  const rawShadowValue = habit.inverted
    ? habit.target - (userValue - habit.target)
    : habit.target + (habit.target - userValue);

  return roundToStep(clamp(rawShadowValue, habit.min, habit.max), habit.step);
}

export function invertLog(log: HabitLog): HabitLog {
  return {
    date: log.date,
    sleep: invertHabit("sleep", log.sleep),
    exercise: invertHabit("exercise", log.exercise),
    water: invertHabit("water", log.water),
    screen_time: invertHabit("screen_time", log.screen_time),
    social: invertHabit("social", log.social)
  };
}

export function getCompliance(key: HabitKey, value: number): number {
  const habit = HABITS[key];

  if (habit.inverted) {
    if (value === 0) {
      return 1.5;
    }

    return Math.min(1.5, habit.target / value);
  }

  return Math.min(1.5, value / habit.target);
}

export function scoreDay(values: HabitValues): Scores {
  const scores = SCORE_AXES.reduce(
    (nextScores, axis) => ({ ...nextScores, [axis]: 0 }),
    {} as Scores
  );

  for (const key of HABIT_KEYS) {
    const compliance = getCompliance(key, values[key]);

    for (const axis of SCORE_AXES) {
      scores[axis] += compliance * HABITS[key].weights[axis] * 100;
    }
  }

  return {
    energy: Math.min(100, Math.round(scores.energy)),
    focus: Math.min(100, Math.round(scores.focus)),
    mood: Math.min(100, Math.round(scores.mood))
  };
}

export function sortLogsOldestFirst(logs: HabitLog[]): HabitLog[] {
  return [...logs].sort((a, b) => a.date.localeCompare(b.date));
}

export function getLatestLogs(logs: HabitLog[], count: number): HabitLog[] {
  return sortLogsOldestFirst(logs).slice(-count);
}

export function formatHabitValue(key: HabitKey, value: number): string {
  const habit = HABITS[key];
  const unit = Math.abs(value) === 1 ? habit.unit : habit.unitPlural;
  return `${Number.isInteger(value) ? value.toString() : value.toFixed(1)} ${unit}`;
}
