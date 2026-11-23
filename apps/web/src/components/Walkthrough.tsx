import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BarChart3, CalendarDays, Settings, WandSparkles, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { markTourSeen } from "../lib/tour.js";
import { quickFade } from "../lib/motion.js";

type WalkthroughProps = {
  onClose: () => void;
};

type Step = {
  icon: ReactNode;
  title: string;
  body: ReactNode;
};

const iconClass = "text-accent";

const steps: Step[] = [
  {
    icon: <CalendarDays size={22} aria-hidden="true" className={iconClass} />,
    title: "Log your day",
    body: (
      <>
        On <strong>Log</strong>, move the five sliders once a day — sleep, exercise, water, screen time, and
        social time — then hit <strong>log my day</strong>. The numbers under each slider show what your
        Shadow did instead. Not ready to wait a week? <strong>try with sample data</strong> fills in seven
        days instantly.
      </>
    )
  },
  {
    icon: <BarChart3 size={22} aria-hidden="true" className={iconClass} />,
    title: "Read the dashboard",
    body: (
      <>
        The <strong>Dashboard</strong> shows your scores against your Shadow's — the <strong>score race</strong>{" "}
        at the bottom compares you side by side, the charts show both lines over time, and the stat cards call
        out which habit is hurting you most and when the gap widens.
      </>
    )
  },
  {
    icon: <WandSparkles size={22} aria-hidden="true" className={iconClass} />,
    title: "Run the simulation",
    body: (
      <>
        After <strong>7 logged days</strong>, open <strong>Simulation</strong> and run a 30-day projection of
        where you and your Shadow are heading. Add an AI key in Settings if you want an AI-written summary —
        without one, a built-in summary is written instantly.
      </>
    )
  },
  {
    icon: <Settings size={22} aria-hidden="true" className={iconClass} />,
    title: "Your data, your rules",
    body: (
      <>
        Everything lives in this browser — nothing is uploaded. In <strong>Settings</strong> you can download
        a backup, restore it elsewhere, add an AI key, or delete it all. The <strong>moon icon</strong> up top
        switches between light and dark.
      </>
    )
  }
];

export function Walkthrough({ onClose }: WalkthroughProps) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  function finish() {
    markTourSeen();
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="App walkthrough"
      className="fixed inset-0 z-30 flex items-center justify-center bg-ink/45 px-4"
      onClick={finish}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={quickFade}
        className="w-full max-w-md rounded-md border border-line bg-card p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accent-soft">
            {step.icon}
          </div>
          <button
            type="button"
            onClick={finish}
            aria-label="Close walkthrough"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-subtle hover:text-ink"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={index} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={quickFade}>
            <h2 className="text-lg font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-soft">{step.body}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, dotIndex) => (
              <span
                key={dotIndex}
                className={`h-1.5 rounded-full transition-all ${dotIndex === index ? "w-5 bg-accent" : "w-1.5 bg-line-strong"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {index > 0 ? (
              <button
                type="button"
                onClick={() => setIndex(index - 1)}
                className="inline-flex h-9 items-center gap-1 rounded-md border border-line bg-card px-3 text-sm font-semibold text-ink transition hover:border-line-strong"
              >
                <ArrowLeft size={15} aria-hidden="true" />
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => (isLast ? finish() : setIndex(index + 1))}
              className="inline-flex h-9 items-center gap-1 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover"
            >
              {isLast ? "Done" : "Next"}
              {isLast ? null : <ArrowRight size={15} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
