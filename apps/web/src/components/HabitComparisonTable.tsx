import { formatHabitValue, getHabitWinner, HABIT_KEYS, HABITS, invertLog, type HabitLog } from "@shadow-self/shared";
import { motion } from "framer-motion";
import { cardVariants } from "../lib/motion.js";
import { habitIcons } from "./habitIcons.js";

type HabitComparisonTableProps = {
  log: HabitLog;
};

function valueClass(winner: "user" | "shadow" | "tie", side: "user" | "shadow") {
  if (winner === "tie" || winner !== side) {
    return "inline-flex min-h-8 items-center rounded-md px-2 text-sm font-medium text-[#202124]";
  }

  return "inline-flex min-h-8 items-center rounded-md bg-[#e6f6f0] px-2 text-sm font-semibold text-[#1D9E75]";
}

export function HabitComparisonTable({ log }: HabitComparisonTableProps) {
  const shadowLog = invertLog(log);

  return (
    <motion.section
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      className="rounded-md border border-[#dfe3ea] bg-white p-4"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">You vs Shadow</h2>
          <p className="text-sm text-[#626976]">{log.date}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[620px]">
          <div className="grid grid-cols-[minmax(0,1fr)_9rem_minmax(0,1fr)] border-b border-[#dfe3ea] pb-3 text-xs font-semibold uppercase tracking-normal">
            <div className="text-right text-[#534AB7]">You</div>
            <div aria-hidden="true" />
            <div className="text-[#D85A30]">Shadow</div>
          </div>

          <div>
            {HABIT_KEYS.map((key) => {
              const habit = HABITS[key];
              const Icon = habitIcons[key];
              const winner = getHabitWinner(key, log[key], shadowLog[key]);

              return (
                <div
                  key={key}
                  className="grid grid-cols-[minmax(0,1fr)_9rem_minmax(0,1fr)] items-center border-b border-[#eef0f4] py-3 last:border-b-0"
                >
                  <div className="flex justify-end pr-4 text-right">
                    <span className={valueClass(winner, "user")}>{formatHabitValue(key, log[key])}</span>
                  </div>

                  <div className="flex items-center justify-center gap-2 border-x border-[#eef0f4] px-3 text-center">
                    <Icon size={17} aria-hidden="true" className="shrink-0 text-[#626976]" />
                    <span className="text-sm font-medium text-[#4b515c]">{habit.name}</span>
                  </div>

                  <div className="flex justify-start pl-4">
                    <span className={valueClass(winner, "shadow")}>
                      {formatHabitValue(key, shadowLog[key])}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
