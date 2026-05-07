import { HABIT_KEYS, HABITS, type HabitKey } from "./habitTypes.js";

export function idealDistance(key: HabitKey, value: number): number {
  const habit = HABITS[key];

  if (habit.inverted && value <= habit.target) {
    return 0;
  }

  return Math.abs(value - habit.target);
}

export function getHabitWinner(key: HabitKey, userValue: number, shadowValue: number): "user" | "shadow" | "tie" {
  const userDistance = idealDistance(key, userValue);
  const shadowDistance = idealDistance(key, shadowValue);

  if (userDistance === shadowDistance) {
    return "tie";
  }

  return userDistance < shadowDistance ? "user" : "shadow";
}

export function hasCompleteHabitValues(values: Partial<Record<HabitKey, number>>): boolean {
  return HABIT_KEYS.every((key) => typeof values[key] === "number");
}
