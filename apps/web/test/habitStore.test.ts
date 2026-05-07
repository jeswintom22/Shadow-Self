import {
  DEFAULT_TODAY,
  createMockLogs,
  type HabitLog,
  type SimulationVerdict
} from "@shadow-self/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { HABIT_STORAGE_KEY, useHabitStore } from "../src/store/habitStore.js";

function resetStore() {
  useHabitStore.getState().reset();
  window.localStorage.clear();
}

function createVerdict(lastInputDate = "2026-05-07"): SimulationVerdict {
  const projection = Array.from({ length: 30 }, (_, index) => ({
    day: index + 1,
    energy: 80,
    focus: 75,
    mood: 78
  }));

  return {
    user: projection,
    shadow: projection,
    narrative: {
      user: "User path.",
      shadow: "Shadow path.",
      comparison: "Comparison path."
    },
    generatedAt: "2026-05-07T00:00:00.000Z",
    lastInputDate
  };
}

beforeEach(() => {
  resetStore();
});

describe("habit store", () => {
  it("updates the in-progress today values", () => {
    useHabitStore.getState().setTodayValue("sleep", 6);

    expect(useHabitStore.getState().today.sleep).toBe(6);
  });

  it("submits today once and prevents duplicate logs for the same date", () => {
    useHabitStore.getState().setTodayValue("sleep", 6);

    expect(useHabitStore.getState().submitToday("2026-05-07")).toBe(true);

    useHabitStore.getState().setTodayValue("sleep", 7);

    expect(useHabitStore.getState().submitToday("2026-05-07")).toBe(false);
    expect(useHabitStore.getState().logs["2026-05-07"]?.sleep).toBe(6);
    expect(useHabitStore.getState().today.sleep).toBe(7);
  });

  it("loads seven days of mock data", () => {
    useHabitStore.getState().loadMockData(new Date("2026-05-07T12:00:00"));

    expect(Object.keys(useHabitStore.getState().logs)).toHaveLength(7);
    expect(useHabitStore.getState().logs["2026-05-01"]?.sleep).toBe(5.5);
    expect(useHabitStore.getState().isReady()).toBe(true);
  });

  it("resets logs, today, and verdict", () => {
    useHabitStore.getState().loadMockData(new Date("2026-05-07T12:00:00"));
    useHabitStore.getState().setVerdict(createVerdict());

    useHabitStore.getState().reset();

    expect(useHabitStore.getState().logs).toEqual({});
    expect(useHabitStore.getState().today).toEqual(DEFAULT_TODAY);
    expect(useHabitStore.getState().verdict).toBeNull();
  });

  it("returns recent logs oldest-to-newest", () => {
    const logs: HabitLog[] = [
      { date: "2026-05-07", sleep: 8, exercise: 30, water: 8, screen_time: 2, social: 1 },
      { date: "2026-05-05", sleep: 8, exercise: 30, water: 8, screen_time: 2, social: 1 },
      { date: "2026-05-06", sleep: 8, exercise: 30, water: 8, screen_time: 2, social: 1 }
    ];

    useHabitStore.setState({
      logs: Object.fromEntries(logs.map((log) => [log.date, log]))
    });

    expect(useHabitStore.getState().getRecentLogs(2).map((log) => log.date)).toEqual([
      "2026-05-06",
      "2026-05-07"
    ]);
  });

  it("returns scored history for user and Shadow scores", () => {
    useHabitStore.getState().loadMockData(new Date("2026-05-07T12:00:00"));

    const history = useHabitStore.getState().getScoredHistory();

    expect(history).toHaveLength(7);
    expect(history[0]).toMatchObject({
      date: "2026-05-01",
      userEnergy: 45,
      shadowEnergy: 100
    });
  });

  it("persists logs and verdict but not the today form", () => {
    useHabitStore.getState().setTodayValue("sleep", 5);
    useHabitStore.getState().loadMockData(new Date("2026-05-07T12:00:00"));
    useHabitStore.getState().setVerdict(createVerdict());

    const persisted = JSON.parse(window.localStorage.getItem(HABIT_STORAGE_KEY) ?? "{}") as {
      state?: Record<string, unknown>;
    };

    expect(persisted.state?.logs).toBeDefined();
    expect(persisted.state?.verdict).toBeDefined();
    expect(persisted.state?.today).toBeUndefined();
  });

  it("allows rerunning only after newer data is logged", () => {
    const logs = createMockLogs(new Date("2026-05-07T12:00:00"));
    useHabitStore.setState({ logs: Object.fromEntries(logs.map((log) => [log.date, log])) });
    useHabitStore.getState().setVerdict(createVerdict("2026-05-07"));

    expect(useHabitStore.getState().canRunSimulation()).toBe(false);

    useHabitStore.getState().submitToday("2026-05-08");

    expect(useHabitStore.getState().canRunSimulation()).toBe(true);
  });
});
