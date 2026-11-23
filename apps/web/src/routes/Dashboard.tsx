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
import { motion } from "framer-motion";
import { Database } from "lucide-react";
import { useMemo } from "react";
import { EmptyState } from "../components/EmptyState.js";
import { HabitComparisonTable } from "../components/HabitComparisonTable.js";
import { ScoreChart } from "../components/ScoreCharts.js";
import { historyToChartData } from "../lib/chartData.js";
import { cardVariants } from "../lib/motion.js";
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
  const data = useMemo(() => historyToChartData(history, projection ?? undefined), [history, projection]);
  const divergenceTrend = useMemo(() => calculateDivergenceTrend(history), [history]);
  const divergenceMessage = createDivergenceMessage(divergenceTrend.direction, divergenceTrend.weeklyChange);
  const dominantInsight = useMemo(() => (latestLog ? getDominantInsight(latestLog) : null), [latestLog]);
  const streakInsight = useMemo(() => getStrongestStreak(calculateShadowStreaks(history)), [history]);
  const criticalThreshold = useMemo(() => (projection ? detectCriticalThreshold(projection.user) : null), [
    projection
  ]);
  const remainingDays = Math.max(0, 7 - history.length);

  if (history.length === 0) {
    return (
      <EmptyState
        title="log seven days to see your shadow diverge"
        description="Your first chart appears as soon as you log a day. The full projection unlocks after seven days."
        action={
          <button
            type="button"
            onClick={() => loadMockData()}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-card"
          >
            <Database size={17} aria-hidden="true" />
            try with sample data
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Dashboard</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          The solid line is you. The dashed line is the Shadow computed from the same habit math.
        </p>
      </header>

      {remainingDays > 0 ? (
        <div className="rounded-md border border-warn-line bg-warn-soft px-4 py-3 text-sm font-medium text-warn-ink">
          {remainingDays} more {remainingDays === 1 ? "day" : "days"} until your shadow fully diverges.
        </div>
      ) : null}

      <ScoreChart title="Energy" axis="energy" data={data} showThresholdMarkers={Boolean(projection)} />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <motion.article
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          className="rounded-md border border-line bg-card p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-normal text-muted">Divergence</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink">{divergenceMessage}</p>
        </motion.article>

        <motion.article
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          className="rounded-md border border-line bg-card p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-normal text-muted">Dominant habit</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink">
            {dominantInsight && dominantInsight.percent > 0
              ? `${HABITS[dominantInsight.habit].name} is driving ${Math.round(
                  dominantInsight.percent
                )}% of ${dominantInsight.axis} decline`
              : "No active habit deficit is driving decline"}
          </p>
        </motion.article>

        <motion.article
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          className="rounded-md border border-line bg-card p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-normal text-muted">Shadow wins</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink">
            {streakInsight.count > 0
              ? `Shadow has outperformed you in ${streakInsight.axis} for ${streakInsight.count} straight ${
                  streakInsight.count === 1 ? "day" : "days"
                }`
              : "Shadow has no active score streak"}
          </p>
        </motion.article>

        <motion.article
          variants={cardVariants}
          initial="rest"
          whileHover="hover"
          className="rounded-md border border-line bg-card p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-normal text-muted">Critical threshold</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink">
            {criticalThreshold
              ? `Projected ${criticalThreshold.category} crosses recovery threshold in ${
                  criticalThreshold.day
                } ${criticalThreshold.day === 1 ? "day" : "days"}`
              : projection
                ? "No recovery threshold is crossed in 30 days"
                : "Threshold projection unlocks after seven logged days"}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted">
            {criticalThreshold
              ? `Floor: ${CRITICAL_THRESHOLDS[criticalThreshold.category]} ${toLowerLabel(
                  criticalThreshold.category
                )} points.`
              : "Energy 40, focus 45, mood 40."}
          </p>
        </motion.article>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ScoreChart title="Focus" axis="focus" data={data} compact showThresholdMarkers={Boolean(projection)} />
        <ScoreChart title="Mood" axis="mood" data={data} compact showThresholdMarkers={Boolean(projection)} />
      </div>

      {latestLog ? <HabitComparisonTable log={latestLog} /> : null}
    </div>
  );
}
