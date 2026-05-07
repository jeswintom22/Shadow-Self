import { getLatestLogs } from "@shadow-self/shared";
import { AlertCircle, RefreshCcw, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { runSimulation } from "../api/simulation.js";
import { EmptyState } from "../components/EmptyState.js";
import { ScoreChart } from "../components/ScoreCharts.js";
import { projectionToChartData } from "../lib/chartData.js";
import { useHabitStore } from "../store/habitStore.js";

export function Simulation() {
  const logMap = useHabitStore((state) => state.logs);
  const verdict = useHabitStore((state) => state.verdict);
  const setVerdict = useHabitStore((state) => state.setVerdict);
  const logs = useMemo(() => getLatestLogs(Object.values(logMap), 7), [logMap]);
  const latestLog = logs.at(-1) ?? null;
  const isReady = Object.keys(logMap).length >= 7;
  const canRunSimulation = isReady && Boolean(latestLog) && (!verdict || latestLog!.date > verdict.lastInputDate);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRunSimulation() {
    if (!canRunSimulation || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextVerdict = await runSimulation(logs);
      setVerdict(nextVerdict);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The simulation could not be completed.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isReady) {
    return (
      <EmptyState
        title="log seven days to see your shadow diverge"
        description="The simulation uses exactly seven recent days of real logs and their inverted Shadow logs."
      />
    );
  }

  if (error) {
    return (
      <section className="rounded-md border border-[#f3c9b7] bg-white p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-1 text-[#D85A30]" size={22} aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-semibold">Simulation failed</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#626976]">{error}</p>
            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isLoading || !canRunSimulation}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-[#534AB7] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#b6b1df]"
            >
              <RefreshCcw size={17} aria-hidden="true" />
              retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  const chartData = verdict ? projectionToChartData(verdict.user, verdict.shadow) : [];
  const buttonLabel = isLoading ? "running simulation" : verdict && !canRunSimulation ? "simulation current" : "run 30-day simulation";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Simulation</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#626976]">
            The backend sends your last seven logs and their Shadow inversions to Claude for a thirty-day projection.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRunSimulation}
          disabled={isLoading || !canRunSimulation}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#534AB7] px-4 text-sm font-semibold text-white transition hover:bg-[#473f9c] disabled:cursor-not-allowed disabled:bg-[#b6b1df]"
        >
          <WandSparkles size={17} aria-hidden="true" />
          {buttonLabel}
        </button>
      </header>

      {isLoading ? (
        <section className="rounded-md border border-[#dfe3ea] bg-white p-6 text-sm text-[#626976]">
          Claude is projecting the next thirty days.
        </section>
      ) : null}

      {verdict ? (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-md border border-[#dfe3ea] bg-white p-4">
              <h2 className="font-semibold text-[#534AB7]">You</h2>
              <p className="mt-3 text-sm leading-6 text-[#4b515c]">{verdict.narrative.user}</p>
            </article>
            <article className="rounded-md border border-[#dfe3ea] bg-white p-4">
              <h2 className="font-semibold text-[#D85A30]">Shadow</h2>
              <p className="mt-3 text-sm leading-6 text-[#4b515c]">{verdict.narrative.shadow}</p>
            </article>
            <article className="rounded-md border border-[#dfe3ea] bg-white p-4">
              <h2 className="font-semibold text-[#202124]">Divergence</h2>
              <p className="mt-3 text-sm leading-6 text-[#4b515c]">{verdict.narrative.comparison}</p>
            </article>
          </section>

          <ScoreChart title="Projected energy" axis="energy" data={chartData} />
          <div className="grid gap-6 lg:grid-cols-2">
            <ScoreChart title="Projected focus" axis="focus" data={chartData} compact />
            <ScoreChart title="Projected mood" axis="mood" data={chartData} compact />
          </div>
        </>
      ) : (
        <section className="rounded-md border border-dashed border-[#c9ced8] bg-white px-6 py-12 text-center">
          <h2 className="text-xl font-semibold">No projection yet</h2>
          <p className="mt-3 text-sm text-[#626976]">Run the simulation when you are ready to compare the paths.</p>
        </section>
      )}
    </div>
  );
}
