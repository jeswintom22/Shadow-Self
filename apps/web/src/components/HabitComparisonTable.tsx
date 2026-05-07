import { formatHabitValue, getHabitWinner, HABIT_KEYS, HABITS, invertLog, type HabitLog } from "@shadow-self/shared";
import { habitIcons } from "./habitIcons.js";

type HabitComparisonTableProps = {
  log: HabitLog;
};

function valueClass(winner: "user" | "shadow" | "tie", side: "user" | "shadow") {
  if (winner === "tie" || winner !== side) {
    return "font-medium text-[#202124]";
  }

  return "rounded-md bg-[#e6f6f0] px-2 py-1 font-semibold text-[#1D9E75]";
}

export function HabitComparisonTable({ log }: HabitComparisonTableProps) {
  const shadowLog = invertLog(log);

  return (
    <section className="rounded-md border border-[#dfe3ea] bg-white p-4">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Today side by side</h2>
          <p className="text-sm text-[#626976]">{log.date}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#dfe3ea]">
              <th className="px-3 py-3 font-semibold text-[#626976]">Habit</th>
              <th className="px-3 py-3 font-semibold text-[#534AB7]">You</th>
              <th className="px-3 py-3 font-semibold text-[#D85A30]">Shadow</th>
            </tr>
          </thead>
          <tbody>
            {HABIT_KEYS.map((key) => {
              const habit = HABITS[key];
              const Icon = habitIcons[key];
              const winner = getHabitWinner(key, log[key], shadowLog[key]);

              return (
                <tr key={key} className="border-b border-[#eef0f4] last:border-b-0">
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <Icon size={18} aria-hidden="true" className="text-[#626976]" />
                      <span className="font-medium">{habit.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span className={valueClass(winner, "user")}>{formatHabitValue(key, log[key])}</span>
                  </td>
                  <td className="px-3 py-4">
                    <span className={valueClass(winner, "shadow")}>
                      {formatHabitValue(key, shadowLog[key])}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
