import { invertLog, scoreDay, sortLogsOldestFirst } from "@shadow-self/shared";
import { Database } from "lucide-react";
import { useMemo } from "react";
import { EmptyState } from "../components/EmptyState.js";
import { HabitComparisonTable } from "../components/HabitComparisonTable.js";
import { ScoreChart } from "../components/ScoreCharts.js";
import { historyToChartData } from "../lib/chartData.js";
import { useHabitStore } from "../store/habitStore.js";

export function Dashboard() {
  const logs = useHabitStore((state) => state.logs);
  const loadMockData = useHabitStore((state) => state.loadMockData);
  const sortedLogs = useMemo(() => sortLogsOldestFirst(Object.values(logs)), [logs]);
  const latestLog = sortedLogs.at(-1) ?? null;
  const history = useMemo(
    () =>
      sortedLogs.map((log) => {
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
      }),
    [sortedLogs]
  );
  const data = historyToChartData(history);
  const remainingDays = Math.max(0, 7 - history.length);

  if (history.length === 0) {
    return (
      <EmptyState
        title="log seven days to see your shadow diverge"
        description="Your first chart appears as soon as you log a day. The full projection unlocks after seven days."
        action={
          import.meta.env.DEV ? (
            <button
              type="button"
              onClick={() => loadMockData()}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-[#202124] px-4 text-sm font-semibold text-white"
            >
              <Database size={17} aria-hidden="true" />
              load sample data
            </button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Dashboard</h1>
        <p className="max-w-2xl text-sm leading-6 text-[#626976]">
          The solid line is you. The dashed line is the Shadow computed from the same habit math.
        </p>
      </header>

      {remainingDays > 0 ? (
        <div className="rounded-md border border-[#f3c9b7] bg-[#fff6f1] px-4 py-3 text-sm font-medium text-[#9d3f1d]">
          {remainingDays} more {remainingDays === 1 ? "day" : "days"} until your shadow fully diverges.
        </div>
      ) : null}

      <ScoreChart title="Energy" axis="energy" data={data} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ScoreChart title="Focus" axis="focus" data={data} compact />
        <ScoreChart title="Mood" axis="mood" data={data} compact />
      </div>

      {latestLog ? <HabitComparisonTable log={latestLog} /> : null}
    </div>
  );
}
