import { HABIT_KEYS, HABITS, formatHabitValue, invertHabit, toLocalDateKey } from "@shadow-self/shared";
import { Database, Save } from "lucide-react";
import { motion } from "framer-motion";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ShadowDivergencePreview } from "../components/ShadowDivergencePreview.js";
import { habitIcons } from "../components/habitIcons.js";
import { cardVariants, quickFade } from "../lib/motion.js";
import { useHabitStore } from "../store/habitStore.js";

export function LogHabits() {
  const navigate = useNavigate();
  const today = useHabitStore((state) => state.today);
  const logs = useHabitStore((state) => state.logs);
  const setTodayValue = useHabitStore((state) => state.setTodayValue);
  const submitToday = useHabitStore((state) => state.submitToday);
  const loadMockData = useHabitStore((state) => state.loadMockData);
  const todayKey = toLocalDateKey();
  const alreadyLogged = Boolean(logs[todayKey]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitToday(todayKey)) {
      navigate("/dashboard");
    }
  }

  function handleLoadSampleData() {
    loadMockData();
    navigate("/dashboard");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium text-[#626976]">{todayKey}</p>
        <h1 className="text-3xl font-semibold tracking-normal">Daily check-in</h1>
      </header>

      <ShadowDivergencePreview values={today} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {HABIT_KEYS.map((key) => {
          const habit = HABITS[key];
          const Icon = habitIcons[key];
          const value = today[key];
          const shadowValue = invertHabit(key, value);

          return (
            <motion.section
              key={key}
              variants={cardVariants}
              initial="rest"
              whileHover="hover"
              className="rounded-md border border-[#dfe3ea] bg-white p-4"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#f0f2f6] text-[#202124]">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <label htmlFor={key} className="block font-semibold">
                      {habit.name}
                    </label>
                    <p className="text-sm text-[#626976]">
                      target {formatHabitValue(key, habit.target)}
                    </p>
                  </div>
                </div>
                <output htmlFor={key} className="text-lg font-semibold text-[#534AB7]">
                  {formatHabitValue(key, value)}
                </output>
              </div>

              <motion.input
                id={key}
                type="range"
                min={habit.min}
                max={habit.max}
                step={habit.step}
                value={value}
                disabled={alreadyLogged}
                onChange={(event) => setTodayValue(key, Number(event.currentTarget.value))}
                whileTap={{ scale: 1.012 }}
                whileFocus={{ scale: 1.006 }}
                transition={quickFade}
                className="h-2 w-full origin-center accent-[#534AB7] disabled:cursor-not-allowed disabled:opacity-50"
              />
              <motion.p
                key={`${key}-${shadowValue}`}
                initial={{ opacity: 0.55 }}
                animate={{ opacity: 1 }}
                transition={quickFade}
                className="mt-3 text-sm text-[#626976]"
              >
                Shadow <span className="font-semibold text-[#D85A30]">{formatHabitValue(key, shadowValue)}</span>
              </motion.p>
            </motion.section>
          );
        })}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={alreadyLogged}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#534AB7] px-4 text-sm font-semibold text-white transition hover:bg-[#473f9c] disabled:cursor-not-allowed disabled:bg-[#b6b1df]"
          >
            <Save size={17} aria-hidden="true" />
            {alreadyLogged ? "already logged today" : "log my day"}
          </button>
          {import.meta.env.DEV ? (
            <button
              type="button"
              onClick={handleLoadSampleData}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#c9ced8] bg-white px-4 text-sm font-semibold text-[#202124] transition hover:border-[#9aa3b5]"
            >
              <Database size={17} aria-hidden="true" />
              load sample data
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
