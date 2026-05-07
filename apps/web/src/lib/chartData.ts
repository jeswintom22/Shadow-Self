import type { ProjectionPoint } from "@shadow-self/shared";
import type { ScoredHistoryPoint } from "../store/habitStore.js";
import type { ChartDatum } from "../components/ScoreCharts.js";

type ProjectionSeries = {
  user: ProjectionPoint[];
  shadow: ProjectionPoint[];
};

export function dateToShortLabel(date: string): string {
  return date.slice(5);
}

export function historyToChartData(history: ScoredHistoryPoint[], projection?: ProjectionSeries): ChartDatum[] {
  const chartHistory = history.map((point) => ({
    label: dateToShortLabel(point.date),
    userEnergy: point.userEnergy,
    shadowEnergy: point.shadowEnergy,
    userFocus: point.userFocus,
    shadowFocus: point.shadowFocus,
    userMood: point.userMood,
    shadowMood: point.shadowMood
  }));

  if (!projection || history.length === 0) {
    return chartHistory;
  }

  const latestHistory = history[history.length - 1];
  const continuationStart: ChartDatum = {
    ...chartHistory[chartHistory.length - 1],
    projectedUserEnergy: latestHistory.userEnergy,
    projectedShadowEnergy: latestHistory.shadowEnergy,
    projectedUserFocus: latestHistory.userFocus,
    projectedShadowFocus: latestHistory.shadowFocus,
    projectedUserMood: latestHistory.userMood,
    projectedShadowMood: latestHistory.shadowMood
  };

  const projectedRows = projection.user.map((point, index) => ({
    label: `+${point.day}`,
    projectedUserEnergy: point.energy,
    projectedShadowEnergy: projection.shadow[index]?.energy,
    projectedUserFocus: point.focus,
    projectedShadowFocus: projection.shadow[index]?.focus,
    projectedUserMood: point.mood,
    projectedShadowMood: projection.shadow[index]?.mood
  }));

  return [...chartHistory.slice(0, -1), continuationStart, ...projectedRows];
}

export function projectionToChartData(user: ProjectionPoint[], shadow: ProjectionPoint[]): ChartDatum[] {
  return user.map((point, index) => ({
    label: `Day ${point.day}`,
    userEnergy: point.energy,
    shadowEnergy: shadow[index]?.energy,
    userFocus: point.focus,
    shadowFocus: shadow[index]?.focus,
    userMood: point.mood,
    shadowMood: shadow[index]?.mood
  }));
}
