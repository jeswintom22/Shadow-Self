import {
  HABIT_KEYS,
  HABITS,
  SCORE_AXES,
  getCompliance,
  type HabitKey,
  type HabitValues,
  type ScoreAxis,
  type Scores
} from "./habitTypes.js";

export type DominantHabits = Record<ScoreAxis, HabitKey>;

export type HabitContributionBreakdown = Record<HabitKey, Scores>;

function calculateHabitImpact(values: HabitValues, key: HabitKey, axis: ScoreAxis): number {
  const complianceDeficit = Math.max(0, 1 - getCompliance(key, values[key]));

  return complianceDeficit * HABITS[key].weights[axis];
}

function createZeroBreakdown(): HabitContributionBreakdown {
  return Object.fromEntries(
    HABIT_KEYS.map((key) => [
      key,
      {
        energy: 0,
        focus: 0,
        mood: 0
      }
    ])
  ) as HabitContributionBreakdown;
}

function calculateRawImpacts(values: HabitValues): HabitContributionBreakdown {
  const breakdown = createZeroBreakdown();

  for (const key of HABIT_KEYS) {
    for (const axis of SCORE_AXES) {
      breakdown[key][axis] = calculateHabitImpact(values, key, axis);
    }
  }

  return breakdown;
}

export function calculateDominantNegativeHabits(values: HabitValues): DominantHabits {
  const impacts = calculateRawImpacts(values);

  return SCORE_AXES.reduce(
    (dominant, axis) => {
      const dominantKey = HABIT_KEYS.reduce((currentDominant, key) =>
        impacts[key][axis] > impacts[currentDominant][axis] ? key : currentDominant
      );

      return {
        ...dominant,
        [axis]: dominantKey
      };
    },
    {
      energy: HABIT_KEYS[0],
      focus: HABIT_KEYS[0],
      mood: HABIT_KEYS[0]
    } satisfies DominantHabits
  );
}

export function calculateHabitContributionBreakdown(values: HabitValues): HabitContributionBreakdown {
  const impacts = calculateRawImpacts(values);
  const breakdown = createZeroBreakdown();

  for (const axis of SCORE_AXES) {
    const axisTotal = HABIT_KEYS.reduce((total, key) => total + impacts[key][axis], 0);

    for (const key of HABIT_KEYS) {
      breakdown[key][axis] = axisTotal === 0 ? 0 : (impacts[key][axis] / axisTotal) * 100;
    }
  }

  return breakdown;
}
