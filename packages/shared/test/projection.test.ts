import { describe, expect, it } from "vitest";
import {
  DEFAULT_TODAY,
  calculateProjection,
  calculateProjectionPair,
  detectCriticalThreshold,
  scoreDay,
  type HabitLog,
  type HabitValues,
  type ProjectionPoint
} from "../src/index.js";

function createLog(day: number, values: HabitValues): HabitLog {
  return {
    date: `2026-05-${String(day).padStart(2, "0")}`,
    ...values
  };
}

function createLogs(values: HabitValues[]): HabitLog[] {
  return values.map((value, index) => createLog(index + 1, value));
}

function flatLogs(values: HabitValues): HabitLog[] {
  return createLogs(Array.from({ length: 7 }, () => values));
}

function expectProjectionShape(projection: ProjectionPoint[]) {
  expect(projection).toHaveLength(30);
  expect(projection[0]?.day).toBe(1);
  expect(projection[29]?.day).toBe(30);

  for (const point of projection) {
    expect(point.energy).toBeGreaterThanOrEqual(0);
    expect(point.energy).toBeLessThanOrEqual(100);
    expect(point.focus).toBeGreaterThanOrEqual(0);
    expect(point.focus).toBeLessThanOrEqual(100);
    expect(point.mood).toBeGreaterThanOrEqual(0);
    expect(point.mood).toBeLessThanOrEqual(100);
  }
}

describe("deterministic projections", () => {
  it("keeps flat target-level trends at 100", () => {
    const projection = calculateProjection(flatLogs(DEFAULT_TODAY));

    expectProjectionShape(projection);
    expect(projection.every((point) => point.energy === 100 && point.focus === 100 && point.mood === 100)).toBe(true);
    expect(detectCriticalThreshold(projection)).toBeNull();
  });

  it("continues negative momentum without leaving the score bounds", () => {
    const logs = createLogs([
      { sleep: 8, exercise: 30, water: 8, screen_time: 2, social: 1 },
      { sleep: 7, exercise: 25, water: 7, screen_time: 3, social: 1 },
      { sleep: 6, exercise: 20, water: 6, screen_time: 4, social: 1 },
      { sleep: 5, exercise: 15, water: 5, screen_time: 5, social: 0.5 },
      { sleep: 4, exercise: 10, water: 4, screen_time: 7, social: 0.5 },
      { sleep: 3, exercise: 5, water: 3, screen_time: 9, social: 0 },
      { sleep: 2, exercise: 0, water: 2, screen_time: 11, social: 0 }
    ]);
    const latestScore = scoreDay(logs[logs.length - 1]);
    const projection = calculateProjection(logs);

    expectProjectionShape(projection);
    expect(projection[0]?.mood).toBeLessThan(latestScore.mood);
    expect(projection[6]?.focus).toBeLessThan(projection[0]?.focus ?? 0);
  });

  it("returns low bounded projections for zero-compliance users", () => {
    const projection = calculateProjection(
      flatLogs({
        sleep: 0,
        exercise: 0,
        water: 0,
        screen_time: 12,
        social: 0
      })
    );

    expectProjectionShape(projection);
    expect(projection[0]?.energy).toBeLessThan(40);
    expect(detectCriticalThreshold(projection)).toEqual({
      category: "mood",
      day: 1
    });
  });

  it("projects both user and Shadow paths from the same source logs", () => {
    const projection = calculateProjectionPair(
      flatLogs({
        sleep: 5,
        exercise: 0,
        water: 4,
        screen_time: 8,
        social: 0
      })
    );

    expectProjectionShape(projection.user);
    expectProjectionShape(projection.shadow);
    expect(projection.shadow[0]?.energy).toBeGreaterThan(projection.user[0]?.energy ?? 0);
  });

  it("detects the first critical threshold crossing", () => {
    expect(
      detectCriticalThreshold([
        { day: 1, energy: 60, focus: 50, mood: 42 },
        { day: 2, energy: 60, focus: 44, mood: 42 },
        { day: 3, energy: 39, focus: 50, mood: 42 }
      ])
    ).toEqual({
      category: "focus",
      day: 2
    });
  });
});
