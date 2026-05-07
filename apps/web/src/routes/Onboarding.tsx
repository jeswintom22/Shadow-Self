import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { completeOnboarding } from "../lib/onboarding.js";

type OnboardingProps = {
  onComplete: () => void;
};

export function Onboarding({ onComplete }: OnboardingProps) {
  const navigate = useNavigate();

  function handleComplete() {
    completeOnboarding();
    onComplete();
    navigate("/log", { replace: true });
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#202124]">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-10">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-[#D85A30]">Shadow Self</p>
          <h1 className="text-5xl font-semibold tracking-normal text-[#202124] sm:text-6xl">Shadow Self</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#4b515c]">
            Log five daily habits and meet the version of you that does the exact opposite. After seven days,
            the lines split into a thirty-day projection for energy, focus, and mood.
          </p>
          <button
            type="button"
            onClick={handleComplete}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-[#202124] px-5 text-sm font-semibold text-white transition hover:bg-[#34363a] focus:outline-none focus:ring-2 focus:ring-[#534AB7] focus:ring-offset-2"
          >
            meet your shadow
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section>
    </main>
  );
}
