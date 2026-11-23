import { HABITS, SCORE_AXES, type HabitLog, type ProjectionPoint, type ScoreAxis, type SimulationNarrative } from "./habitTypes.js";
import { calculateDominantNegativeHabits } from "./analysis.js";

function describePath(points: ProjectionPoint[]): string {
  const first = points[0];
  const last = points.at(-1) ?? first;
  const parts = SCORE_AXES.map((axis: ScoreAxis) => {
    const delta = Math.round(last[axis] - first[axis]);
    const trend = delta > 2 ? "rises" : delta < -2 ? "falls" : "holds steady";
    return `${axis} ${trend} to ${Math.round(last[axis])}`;
  });
  return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)} by day ${last.day}`;
}

export function createTemplateNarrative(
  logs: HabitLog[],
  projection: { user: ProjectionPoint[]; shadow: ProjectionPoint[] }
): SimulationNarrative {
  const latest = logs.at(-1);
  const drivers = latest
    ? [...new Set(Object.values(calculateDominantNegativeHabits(latest)))].map((key) => HABITS[key].name.toLowerCase())
    : [];
  const userEnd = projection.user.at(-1);
  const shadowEnd = projection.shadow.at(-1);
  const total = (p?: ProjectionPoint) => (p ? p.energy + p.focus + p.mood : 0);
  const gap = Math.round((total(shadowEnd) - total(userEnd)) / 3);

  return {
    user: `If your recent habits continue, your ${describePath(projection.user)}.`,
    shadow: `Your Shadow follows the opposite habits: its ${describePath(projection.shadow)}.`,
    comparison:
      gap === 0
        ? "Both paths end in roughly the same place."
        : `By day 30 the ${gap > 0 ? "Shadow is ahead" : "you are ahead"} by about ${Math.abs(gap)} points on average${
            drivers.length ? `, mostly because of ${drivers.join(", ")}` : ""
          }.`
  };
}
