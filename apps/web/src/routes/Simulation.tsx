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
        description={`${Object.keys(logMap).length} of 7 days logged. The simulation uses seven recent days of real logs and their inverted Shadow logs.`}
      />
    );
  }

  if (error) {
    return (
      <section className="rounded-md border border-warn-line bg-card p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-1 text-coral" size={22} aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-semibold">Simulation failed</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{error}</p>
            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isLoading || !canRunSimulation}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-accent/40"
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
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            The backend calculates the thirty-day paths deterministically, then interprets the result — with
            Claude when it's available, or a built-in summary when it's not.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRunSimulation}
          disabled={isLoading || !canRunSimulation}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-accent/40"
        >
          <WandSparkles size={17} aria-hidden="true" />
          {buttonLabel}
        </button>
      </header>

      {isLoading ? (
        <section className="rounded-md border border-line bg-card p-6 text-sm text-muted">
          Calculating the next thirty days, then sending the fixed projection to Claude.
        </section>
      ) : null}

      {verdict ? (
        <>
          {verdict.source ? (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-normal ${
                verdict.source === "claude" ? "bg-accent-soft text-accent" : "bg-subtle text-muted"
              }`}
            >
              {verdict.source === "claude" ? "written by Claude" : "built-in summary — no AI key configured"}
            </span>
          ) : null}
          <section className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-md border border-line bg-card p-4">
              <h2 className="font-semibold text-accent">You</h2>
              <p className="mt-3 text-sm leading-6 text-soft">{verdict.narrative.user}</p>
            </article>
            <article className="rounded-md border border-line bg-card p-4">
              <h2 className="font-semibold text-coral">Shadow</h2>
              <p className="mt-3 text-sm leading-6 text-soft">{verdict.narrative.shadow}</p>
            </article>
            <article className="rounded-md border border-line bg-card p-4">
              <h2 className="font-semibold text-ink">Divergence</h2>
              <p className="mt-3 text-sm leading-6 text-soft">{verdict.narrative.comparison}</p>
            </article>
          </section>

          <ScoreChart title="Projected energy" axis="energy" data={chartData} showThresholdMarkers />
          <div className="grid gap-6 lg:grid-cols-2">
            <ScoreChart title="Projected focus" axis="focus" data={chartData} compact showThresholdMarkers />
            <ScoreChart title="Projected mood" axis="mood" data={chartData} compact showThresholdMarkers />
          </div>
        </>
      ) : (
        <section className="rounded-md border border-dashed border-line-strong bg-card px-6 py-12 text-center">
          <h2 className="text-xl font-semibold">No projection yet</h2>
          <p className="mt-3 text-sm text-muted">Run the simulation when you are ready to compare the paths.</p>
        </section>
      )}
    </div>
  );
}
