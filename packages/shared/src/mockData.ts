import type { HabitLog } from "./habitTypes.js";

export const MOCK_HABIT_VALUES = [
  { sleep: 5.5, exercise: 0, water: 4, screen_time: 7, social: 0.5 },
  { sleep: 6, exercise: 15, water: 5, screen_time: 8, social: 0 },
  { sleep: 7, exercise: 0, water: 3, screen_time: 9, social: 1 },
  { sleep: 5, exercise: 0, water: 4, screen_time: 10, social: 0 },
  { sleep: 6.5, exercise: 20, water: 6, screen_time: 6, social: 2 },
  { sleep: 4, exercise: 0, water: 2, screen_time: 11, social: 0 },
  { sleep: 7.5, exercise: 45, water: 7, screen_time: 4, social: 1.5 }
] satisfies Omit<HabitLog, "date">[];

export function createMockLogs(endDate = new Date()): HabitLog[] {
  return MOCK_HABIT_VALUES.map((values, index) => {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - (MOCK_HABIT_VALUES.length - 1 - index));

    return {
      date: toLocalDateKey(date),
      ...values
    };
  });
}

export function toLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
