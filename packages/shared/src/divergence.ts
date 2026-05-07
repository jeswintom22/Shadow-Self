import type { Scores } from "./habitTypes.js";

export type Divergence = {
  energyGap: number;
  focusGap: number;
  moodGap: number;
  totalGap: number;
};

export type DivergenceTrendDirection = "widening" | "stable" | "narrowing";

export type DivergenceTrend = {
  direction: DivergenceTrendDirection;
  weeklyChange: number;
};

export type ScoredDivergencePoint = {
  user: Scores;
  shadow: Scores;
};

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function calculateDivergence(user: Scores, shadow: Scores): Divergence {
  const energyGap = shadow.energy - user.energy;
  const focusGap = shadow.focus - user.focus;
  const moodGap = shadow.mood - user.mood;

  return {
    energyGap,
    focusGap,
    moodGap,
    totalGap: average([energyGap, focusGap, moodGap])
  };
}

export function calculateDivergenceTrend(scoredDays: ScoredDivergencePoint[]): DivergenceTrend {
  const recentDays = scoredDays.slice(-7);

  if (recentDays.length < 2) {
    return {
      direction: "stable",
      weeklyChange: 0
    };
  }

  const oldestGap = calculateDivergence(recentDays[0].user, recentDays[0].shadow).totalGap;
  const newestGap = calculateDivergence(
    recentDays[recentDays.length - 1].user,
    recentDays[recentDays.length - 1].shadow
  ).totalGap;
  const weeklyChange = newestGap - oldestGap;

  if (weeklyChange > 0) {
    return {
      direction: "widening",
      weeklyChange
    };
  }

  if (weeklyChange < 0) {
    return {
      direction: "narrowing",
      weeklyChange
    };
  }

  return {
    direction: "stable",
    weeklyChange
  };
}
