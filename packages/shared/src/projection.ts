import {
  clamp,
  getLatestLogs,
  invertLog,
  scoreDay,
  type HabitLog,
  type ProjectionPoint,
  type ScoreAxis,
  type Scores
} from "./habitTypes.js";

const PROJECTION_DAYS = 30;
const RECENT_WINDOW = 7;
const SHORT_WINDOW = 3;
const MOMENTUM_WEIGHT = 0.65;
const ROLLING_TREND_WEIGHT = 0.35;
const MOMENTUM_DECAY = 0.94;
const MEAN_REVERSION_WEIGHT = 0.05;

export const CRITICAL_THRESHOLDS = {
  energy: 40,
  focus: 45,
  mood: 40
} as const satisfies Record<ScoreAxis, number>;

const CRITICAL_THRESHOLD_ORDER: ScoreAxis[] = ["mood", "focus", "energy"];

export type CriticalThreshold = {
  category: ScoreAxis;
  day: number;
};

export type ProjectionPair = {
  user: ProjectionPoint[];
  shadow: ProjectionPoint[];
};

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function axisValues(history: Scores[], axis: ScoreAxis): number[] {
  return history.map((scores) => scores[axis]);
}

function weightedAverage(values: number[]): number {
  const weightedTotal = values.reduce((total, value, index) => total + value * (index + 1), 0);
  const weightTotal = values.reduce((total, _value, index) => total + index + 1, 0);

  return weightTotal === 0 ? 0 : weightedTotal / weightTotal;
}

function calculateMomentum(values: number[]): number {
  const deltas = values.slice(1).map((value, index) => value - values[index]);

  return deltas.length === 0 ? 0 : weightedAverage(deltas);
}

function calculateRollingTrend(values: number[]): number {
  const windowSize = Math.min(SHORT_WINDOW, values.length);

  if (windowSize < 2) {
    return 0;
  }

  const earlyAverage = average(values.slice(0, windowSize));
  const recentAverage = average(values.slice(-windowSize));
  const span = Math.max(1, values.length - windowSize);

  return (recentAverage - earlyAverage) / span;
}

function projectAxis(values: number[]): number[] {
  const recentAverage = average(values.slice(-Math.min(SHORT_WINDOW, values.length)));
  const initialVelocity =
    calculateMomentum(values) * MOMENTUM_WEIGHT + calculateRollingTrend(values) * ROLLING_TREND_WEIGHT;
  const projection: number[] = [];
  let current = values.at(-1) ?? recentAverage;

  for (let day = 1; day <= PROJECTION_DAYS; day += 1) {
    const decayedVelocity = initialVelocity * MOMENTUM_DECAY ** (day - 1);
    const meanReversion = (recentAverage - current) * MEAN_REVERSION_WEIGHT;
    current = clamp(current + decayedVelocity + meanReversion, 0, 100);
    projection.push(Math.round(current));
  }

  return projection;
}

export function calculateProjection(logs: HabitLog[]): ProjectionPoint[] {
  const latestLogs = getLatestLogs(logs, RECENT_WINDOW);
  const history = latestLogs.map(scoreDay);

  if (history.length === 0) {
    return [];
  }

  const projectedAxes = {
    energy: projectAxis(axisValues(history, "energy")),
    focus: projectAxis(axisValues(history, "focus")),
    mood: projectAxis(axisValues(history, "mood"))
  } satisfies Record<ScoreAxis, number[]>;

  return Array.from({ length: PROJECTION_DAYS }, (_, index) => ({
    day: index + 1,
    energy: projectedAxes.energy[index],
    focus: projectedAxes.focus[index],
    mood: projectedAxes.mood[index]
  }));
}

export function calculateProjectionPair(logs: HabitLog[]): ProjectionPair {
  const latestLogs = getLatestLogs(logs, RECENT_WINDOW);

  return {
    user: calculateProjection(latestLogs),
    shadow: calculateProjection(latestLogs.map(invertLog))
  };
}

export function detectCriticalThreshold(projection: ProjectionPoint[]): CriticalThreshold | null {
  for (const point of projection) {
    for (const category of CRITICAL_THRESHOLD_ORDER) {
      if (point[category] < CRITICAL_THRESHOLDS[category]) {
        return {
          category,
          day: point.day
        };
      }
    }
  }

  return null;
}
