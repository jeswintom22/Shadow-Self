import {
  DEFAULT_TODAY,
  createMockLogs,
  getLatestLogs,
  invertLog,
  scoreDay,
  sortLogsOldestFirst,
  toLocalDateKey,
  type HabitKey,
  type HabitLog,
  type HabitValues,
  type Scores,
  type SimulationVerdict
} from "@shadow-self/shared";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export const HABIT_STORAGE_KEY = "shadow-self-habits";

export type ScoredHistoryPoint = {
  date: string;
  userEnergy: number;
  shadowEnergy: number;
  userFocus: number;
  shadowFocus: number;
  userMood: number;
  shadowMood: number;
  user: Scores;
  shadow: Scores;
};

export type HabitStore = {
  logs: Record<string, HabitLog>;
  today: HabitValues;
  verdict: SimulationVerdict | null;
  setTodayValue: (key: HabitKey, value: number) => void;
  submitToday: (date?: string) => boolean;
  loadMockData: (endDate?: Date) => void;
  reset: () => void;
  setVerdict: (verdict: SimulationVerdict | null) => void;
  getRecentLogs: (count: number) => HabitLog[];
  getScoredHistory: () => ScoredHistoryPoint[];
  isReady: () => boolean;
  hasLoggedToday: (date?: string) => boolean;
  getLatestLog: () => HabitLog | null;
  canRunSimulation: () => boolean;
};

function freshToday(): HabitValues {
  return { ...DEFAULT_TODAY };
}

function toLogMap(logs: HabitLog[]): Record<string, HabitLog> {
  return Object.fromEntries(logs.map((log) => [log.date, log]));
}

const memoryStorage = (() => {
  const store = new Map<string, string>();

  return {
    getItem(name: string) {
      return store.get(name) ?? null;
    },
    setItem(name: string, value: string) {
      store.set(name, value);
    },
    removeItem(name: string) {
      store.delete(name);
    }
  } satisfies StateStorage;
})();

function safeStorage(): StateStorage {
  try {
    if (window.localStorage && typeof window.localStorage.setItem === "function") {
      return window.localStorage;
    }
  } catch {
    return memoryStorage;
  }

  return memoryStorage;
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      logs: {},
      today: freshToday(),
      verdict: null,
      setTodayValue(key, value) {
        set((state) => ({
          today: {
            ...state.today,
            [key]: value
          }
        }));
      },
      submitToday(date = toLocalDateKey()) {
        if (get().logs[date]) {
          return false;
        }

        const log: HabitLog = {
          date,
          ...get().today
        };

        set((state) => ({
          logs: {
            ...state.logs,
            [date]: log
          },
          today: freshToday()
        }));

        return true;
      },
      loadMockData(endDate = new Date()) {
        set({
          logs: toLogMap(createMockLogs(endDate)),
          today: freshToday(),
          verdict: null
        });
      },
      reset() {
        set({
          logs: {},
          today: freshToday(),
          verdict: null
        });
      },
      setVerdict(verdict) {
        set({ verdict });
      },
      getRecentLogs(count) {
        return getLatestLogs(Object.values(get().logs), count);
      },
      getScoredHistory() {
        return sortLogsOldestFirst(Object.values(get().logs)).map((log) => {
          const user = scoreDay(log);
          const shadow = scoreDay(invertLog(log));

          return {
            date: log.date,
            userEnergy: user.energy,
            shadowEnergy: shadow.energy,
            userFocus: user.focus,
            shadowFocus: shadow.focus,
            userMood: user.mood,
            shadowMood: shadow.mood,
            user,
            shadow
          };
        });
      },
      isReady() {
        return Object.keys(get().logs).length >= 7;
      },
      hasLoggedToday(date = toLocalDateKey()) {
        return Boolean(get().logs[date]);
      },
      getLatestLog() {
        return sortLogsOldestFirst(Object.values(get().logs)).at(-1) ?? null;
      },
      canRunSimulation() {
        const latestLog = get().getLatestLog();
        const verdict = get().verdict;

        return get().isReady() && Boolean(latestLog) && (!verdict || latestLog!.date > verdict.lastInputDate);
      }
    }),
    {
      name: HABIT_STORAGE_KEY,
      storage: createJSONStorage(safeStorage),
      partialize: (state) => ({
        logs: state.logs,
        verdict: state.verdict
      })
    }
  )
);
