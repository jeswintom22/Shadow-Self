import {
  CRITICAL_THRESHOLDS,
  HABITS,
  SCORE_AXES,
  calculateDominantNegativeHabits,
  calculateDivergenceTrend,
  calculateHabitContributionBreakdown,
  calculateProjectionPair,
  calculateShadowStreaks,
  detectCriticalThreshold,
  invertLog,
  scoreDay,
  sortLogsOldestFirst,
  type HabitKey,
  type HabitLog,
  type ScoreAxis
} from "@shadow-self/shared";
import { Database } from "lucide-react";
import { useMemo } from "react";
import { EmptyState } from "../components/EmptyState.js";
import { HabitComparisonTable } from "../components/HabitComparisonTable.js";
import { ScoreChart } from "../components/ScoreCharts.js";
import { historyToChartData } from "../lib/chartData.js";
import { useHabitStore } from "../store/habitStore.js";

type DominantInsight = {
  habit: HabitKey;
  axis: ScoreAxis;
  percent: number;
};

type StreakInsight = {
  axis: ScoreAxis;
  count: number;
};

function formatSigned(value: number): string {
  const rounded = Math.round(value * 10) / 10;

  return `${rounded >= 0 ? "+" : ""}${rounded.toFixed(1)}`;
}

function toLowerLabel(value: string): string {
  return value.toLocaleLowerCase();
}

function createDivergenceMessage(direction: "widening" | "stable" | "narrowing", weeklyChange: number): string {
  if (direction === "widening") {
    return `You are diverging by ${formatSigned(weeklyChange)} points/week`;
  }

  if (direction === "narrowing") {
    return `The gap is narrowing by ${Math.abs(weeklyChange).toFixed(1)} points/week`;
  }

  return `Divergence is stable at ${formatSigned(weeklyChange)} points/week`;
}

function getDominantInsight(log: HabitLog): DominantInsight {
  const dominantHabits = calculateDominantNegativeHabits(log);
  const breakdown = calculateHabitContributionBreakdown(log);
  let strongest: DominantInsight = {
    habit: dominantHabits.energy,
    axis: "energy",
    percent: breakdown[dominantHabits.energy].energy
  };

  for (const axis of SCORE_AXES) {
    const habit = dominantHabits[axis];
    const percent = breakdown[habit][axis];

    if (percent > strongest.percent) {
      strongest = { habit, axis, percent };
    }
  }

  return strongest;
}

function getStrongestStreak(streaks: Record<ScoreAxis, number>): StreakInsight {
  let strongest: StreakInsight = {
    axis: "energy",
    count: streaks.energy
  };

  for (const axis of SCORE_AXES) {
    if (streaks[axis] > strongest.count) {
      strongest = { axis, count: streaks[axis] };
    }
  }

  return strongest;
}

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
  const projection = useMemo(() => (history.length >= 7 ? calculateProjectionPair(sortedLogs) : null), [
    history.length,
    sortedLogs
  ]);
  const data = historyToChartData(history, projection ?? undefined);
  const divergenceTrend = calculateDivergenceTrend(history);
  const divergenceMessage = createDivergenceMessage(divergenceTrend.direction, divergenceTrend.weeklyChange);
  const dominantInsight = latestLog ? getDominantInsight(latestLog) : null;
  const streakInsight = getStrongestStreak(calculateShadowStreaks(history));
  const criticalThreshold = projection ? detectCriticalThreshold(projection.user) : null;
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-md border border-[#dfe3ea] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-[#626976]">Divergence</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#202124]">{divergenceMessage}</p>
          <p className="mt-2 text-xs leading-5 text-[#626976]">Measured across the last seven scored days.</p>
        </article>

        <article className="rounded-md border border-[#dfe3ea] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-[#626976]">Dominant habit</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#202124]">
            {dominantInsight && dominantInsight.percent > 0
              ? `${HABITS[dominantInsight.habit].name} is driving ${Math.round(
                  dominantInsight.percent
                )}% of ${dominantInsight.axis} decline`
              : "No active habit deficit is driving decline"}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#626976]">Weighted by compliance deficit and score impact.</p>
        </article>

        <article className="rounded-md border border-[#dfe3ea] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-[#626976]">Shadow wins</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#202124]">
            {streakInsight.count > 0
              ? `Shadow has outperformed you in ${streakInsight.axis} for ${streakInsight.count} straight ${
                  streakInsight.count === 1 ? "day" : "days"
                }`
              : "Shadow has no active score streak"}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#626976]">Ties break the streak.</p>
        </article>

        <article className="rounded-md border border-[#dfe3ea] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-[#626976]">Critical threshold</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#202124]">
            {criticalThreshold
              ? `Projected ${criticalThreshold.category} crosses recovery threshold in ${
                  criticalThreshold.day
                } ${criticalThreshold.day === 1 ? "day" : "days"}`
              : projection
                ? "No recovery threshold is crossed in 30 days"
                : "Threshold projection unlocks after seven logged days"}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#626976]">
            {criticalThreshold
              ? `Floor: ${CRITICAL_THRESHOLDS[criticalThreshold.category]} ${toLowerLabel(
                  criticalThreshold.category
                )} points.`
              : "Energy 40, focus 45, mood 40."}
          </p>
        </article>
      </section>

      <ScoreChart title="Energy" axis="energy" data={data} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ScoreChart title="Focus" axis="focus" data={data} compact />
        <ScoreChart title="Mood" axis="mood" data={data} compact />
      </div>

      {latestLog ? <HabitComparisonTable log={latestLog} /> : null}
    </div>
  );
}
