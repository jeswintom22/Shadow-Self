import { SCORE_AXES, type ScoreAxis, type Scores } from "./habitTypes.js";

export type ShadowStreaks = Record<ScoreAxis, number>;

export type ScoredStreakPoint = {
  user: Scores;
  shadow: Scores;
};

function createEmptyStreaks(): ShadowStreaks {
  return {
    energy: 0,
    focus: 0,
    mood: 0
  };
}

export function calculateShadowStreaks(scoredDays: ScoredStreakPoint[]): ShadowStreaks {
  const streaks = createEmptyStreaks();

  for (const axis of SCORE_AXES) {
    for (let index = scoredDays.length - 1; index >= 0; index -= 1) {
      const point = scoredDays[index];

      if (point.shadow[axis] <= point.user[axis]) {
        break;
      }

      streaks[axis] += 1;
    }
  }

  return streaks;
}
