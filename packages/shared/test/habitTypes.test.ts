import { describe, expect, it } from "vitest";
import {
  DEFAULT_TODAY,
  createMockLogs,
  getCompliance,
  getHabitWinner,
  getLatestLogs,
  invertHabit,
  invertLog,
  scoreDay,
  sortLogsOldestFirst
} from "../src/index.js";

describe("habit inversion", () => {
  it("inverts standard habits around their target and clamps to bounds", () => {
    expect(invertHabit("sleep", 5)).toBe(11);
    expect(invertHabit("sleep", 4)).toBe(12);
    expect(invertHabit("sleep", 10)).toBe(6);
    expect(invertHabit("exercise", 0)).toBe(60);
    expect(invertHabit("exercise", 120)).toBe(0);
    expect(invertHabit("water", 4)).toBe(12);
    expect(invertHabit("social", 0.5)).toBe(1.5);
  });

  it("inverts screen time with the inverted-habit formula", () => {
    expect(invertHabit("screen_time", 8)).toBe(0);
    expect(invertHabit("screen_time", 2)).toBe(2);
    expect(invertHabit("screen_time", 1)).toBe(3);
  });

  it("inverts a whole log without changing the date", () => {
    expect(
      invertLog({
        date: "2026-05-07",
        sleep: 5.5,
        exercise: 0,
        water: 4,
        screen_time: 7,
        social: 0.5
      })
    ).toEqual({
      date: "2026-05-07",
      sleep: 10.5,
      exercise: 60,
      water: 12,
      screen_time: 0,
      social: 1.5
    });
  });
});

describe("scoring", () => {
  it("scores target values as 100 across all axes", () => {
    expect(scoreDay(DEFAULT_TODAY)).toEqual({ energy: 100, focus: 100, mood: 100 });
  });

  it("caps overachievement and final scores at 100", () => {
    expect(
      scoreDay({
        sleep: 12,
        exercise: 120,
        water: 16,
        screen_time: 0,
        social: 8
      })
    ).toEqual({ energy: 100, focus: 100, mood: 100 });
  });

  it("treats zero screen time as capped inverted compliance", () => {
    expect(getCompliance("screen_time", 0)).toBe(1.5);
  });

  it("computes a realistic imperfect day", () => {
    expect(
      scoreDay({
        sleep: 5.5,
        exercise: 0,
        water: 4,
        screen_time: 7,
        social: 0.5
      })
    ).toEqual({ energy: 45, focus: 35, mood: 36 });
  });
});

describe("helpers", () => {
  it("sorts logs oldest first and returns the latest requested count", () => {
    const logs = [
      { date: "2026-05-07", sleep: 7, exercise: 0, water: 4, screen_time: 7, social: 1 },
      { date: "2026-05-05", sleep: 7, exercise: 0, water: 4, screen_time: 7, social: 1 },
      { date: "2026-05-06", sleep: 7, exercise: 0, water: 4, screen_time: 7, social: 1 }
    ];

    expect(sortLogsOldestFirst(logs).map((log) => log.date)).toEqual([
      "2026-05-05",
      "2026-05-06",
      "2026-05-07"
    ]);
    expect(getLatestLogs(logs, 2).map((log) => log.date)).toEqual(["2026-05-06", "2026-05-07"]);
  });

  it("creates seven consecutive mock logs ending on the requested date", () => {
    const logs = createMockLogs(new Date("2026-05-07T12:00:00"));

    expect(logs).toHaveLength(7);
    expect(logs[0]?.date).toBe("2026-05-01");
    expect(logs[6]?.date).toBe("2026-05-07");
  });

  it("marks the side closer to the ideal habit target", () => {
    expect(getHabitWinner("sleep", 5, 11)).toBe("tie");
    expect(getHabitWinner("screen_time", 8, 0)).toBe("shadow");
    expect(getHabitWinner("screen_time", 1, 3)).toBe("user");
  });
});
