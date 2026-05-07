import { describe, expect, it } from "vitest";
import { calculateShadowStreaks, type Scores } from "../src/index.js";

function scores(energy: number, focus: number, mood: number): Scores {
  return {
    energy,
    focus,
    mood
  };
}

describe("shadow streaks", () => {
  it("counts consecutive days the Shadow outperformed the user per score category", () => {
    const history = [
      {
        user: scores(50, 50, 50),
        shadow: scores(60, 60, 40)
      },
      {
        user: scores(50, 50, 50),
        shadow: scores(60, 60, 55)
      },
      {
        user: scores(50, 50, 50),
        shadow: scores(60, 60, 55)
      },
      {
        user: scores(50, 55, 50),
        shadow: scores(60, 50, 55)
      }
    ];

    expect(calculateShadowStreaks(history)).toEqual({
      energy: 4,
      focus: 0,
      mood: 3
    });
  });

  it("treats identical scores as streak breakers", () => {
    expect(
      calculateShadowStreaks([
        {
          user: scores(70, 70, 70),
          shadow: scores(70, 70, 70)
        }
      ])
    ).toEqual({
      energy: 0,
      focus: 0,
      mood: 0
    });
  });
});
