import { describe, expect, it } from "vitest";
import {
  DEFAULT_TODAY,
  HABIT_KEYS,
  SCORE_AXES,
  calculateDominantNegativeHabits,
  calculateHabitContributionBreakdown,
  type HabitValues,
  type ScoreAxis
} from "../src/index.js";

const zeroComplianceValues = {
  sleep: 0,
  exercise: 0,
  water: 0,
  screen_time: 12,
  social: 0
} satisfies HabitValues;

function axisTotal(breakdown: ReturnType<typeof calculateHabitContributionBreakdown>, axis: ScoreAxis): number {
  return HABIT_KEYS.reduce((total, key) => total + breakdown[key][axis], 0);
}

describe("dominant habit analysis", () => {
  it("uses score weights and compliance deficit to find dominant negative habits", () => {
    expect(calculateDominantNegativeHabits(zeroComplianceValues)).toEqual({
      energy: "sleep",
      focus: "exercise",
      mood: "exercise"
    });
  });

  it("normalizes habit contribution percentages to 100 per score axis", () => {
    const breakdown = calculateHabitContributionBreakdown(zeroComplianceValues);

    for (const axis of SCORE_AXES) {
      expect(axisTotal(breakdown, axis)).toBeCloseTo(100, 8);
    }
  });

  it("isolates a single bad habit as the full decline contributor", () => {
    const screenTimeOnly = {
      ...DEFAULT_TODAY,
      screen_time: 8
    } satisfies HabitValues;
    const breakdown = calculateHabitContributionBreakdown(screenTimeOnly);

    expect(calculateDominantNegativeHabits(screenTimeOnly).focus).toBe("screen_time");
    expect(breakdown.screen_time.focus).toBe(100);
    expect(breakdown.sleep.focus).toBe(0);
  });

  it("returns zero contribution percentages for maxed-out users", () => {
    const maxedOutValues = {
      sleep: 12,
      exercise: 120,
      water: 16,
      screen_time: 0,
      social: 8
    } satisfies HabitValues;
    const breakdown = calculateHabitContributionBreakdown(maxedOutValues);

    for (const axis of SCORE_AXES) {
      expect(axisTotal(breakdown, axis)).toBe(0);
    }
  });
});
