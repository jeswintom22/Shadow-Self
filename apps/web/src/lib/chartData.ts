import type { ProjectionPoint } from "@shadow-self/shared";
import type { ScoredHistoryPoint } from "../store/habitStore.js";
import type { ChartDatum } from "../components/ScoreCharts.js";

export function dateToShortLabel(date: string): string {
  return date.slice(5);
}

export function historyToChartData(history: ScoredHistoryPoint[]): ChartDatum[] {
  return history.map((point) => ({
    label: dateToShortLabel(point.date),
    userEnergy: point.userEnergy,
    shadowEnergy: point.shadowEnergy,
    userFocus: point.userFocus,
    shadowFocus: point.shadowFocus,
    userMood: point.userMood,
    shadowMood: point.shadowMood
  }));
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
