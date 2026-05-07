import { describe, expect, it } from "vitest";
import { calculateDivergence, calculateDivergenceTrend, type Scores } from "../src/index.js";

function scores(value: number): Scores {
  return {
    energy: value,
    focus: value,
    mood: value
  };
}

describe("divergence calculations", () => {
  it("calculates category gaps and average total gap", () => {
    expect(
      calculateDivergence(
        { energy: 50, focus: 60, mood: 70 },
        { energy: 80, focus: 55, mood: 100 }
      )
    ).toEqual({
      energyGap: 30,
      focusGap: -5,
      moodGap: 30,
      totalGap: 55 / 3
    });
  });

  it("returns zero gaps for identical scores", () => {
    expect(calculateDivergence(scores(72), scores(72))).toEqual({
      energyGap: 0,
      focusGap: 0,
      moodGap: 0,
      totalGap: 0
    });
  });

  it("detects widening, stable, and narrowing seven-day trends", () => {
    const widening = Array.from({ length: 7 }, (_, index) => ({
      user: scores(60),
      shadow: scores(60 + index)
    }));
    const stable = Array.from({ length: 7 }, () => ({
      user: scores(60),
      shadow: scores(65)
    }));
    const narrowing = Array.from({ length: 7 }, (_, index) => ({
      user: scores(60),
      shadow: scores(72 - index)
    }));

    expect(calculateDivergenceTrend(widening)).toEqual({
      direction: "widening",
      weeklyChange: 6
    });
    expect(calculateDivergenceTrend(stable)).toEqual({
      direction: "stable",
      weeklyChange: 0
    });
    expect(calculateDivergenceTrend(narrowing)).toEqual({
      direction: "narrowing",
      weeklyChange: -6
    });
  });
});
