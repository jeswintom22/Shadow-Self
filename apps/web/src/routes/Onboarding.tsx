import { ArrowRight, CalendarDays, Moon, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { completeOnboarding } from "../lib/onboarding.js";

type OnboardingProps = {
  onComplete: () => void;
};

const steps = [
  {
    icon: CalendarDays,
    title: "1. Log your day",
    text: "Once a day, move five sliders: sleep, exercise, water, screen time, and social time. Takes under a minute."
  },
  {
    icon: Moon,
    title: "2. Meet your Shadow",
    text: "The app imagines a 'Shadow you' that does the exact opposite of every habit — and scores both of you."
  },
  {
    icon: TrendingUp,
    title: "3. Watch the split",
    text: "After 7 days, unlock a 30-day projection showing where each version of you is heading."
  }
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const navigate = useNavigate();

  function handleComplete() {
    completeOnboarding();
    onComplete();
    navigate("/log", { replace: true });
  }

  return (
    <main className="min-h-screen bg-page text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-10">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-coral">Shadow Self</p>
          <h1 className="text-5xl font-semibold tracking-normal text-ink sm:text-6xl">Shadow Self</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-soft">
            Meet the version of you that does the exact opposite of your habits — and see which one ends up
            better off.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article key={step.title} className="rounded-md border border-line bg-card p-4">
                <Icon size={22} aria-hidden="true" className="text-accent" />
                <h2 className="mt-3 font-semibold">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-10 max-w-2xl">
          <button
            type="button"
            onClick={handleComplete}
            className="inline-flex h-12 items-center gap-2 rounded-md bg-ink px-5 text-sm font-semibold text-card transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            meet your shadow
            <ArrowRight size={18} aria-hidden="true" />
          </button>
          <p className="mt-4 text-xs leading-5 text-muted">
            Everything stays in this browser — no account, no upload. A habit-awareness toy, not medical
            advice.
          </p>
        </div>
      </section>
    </main>
  );
}
