import { SIMULATION_PROVIDERS, type SimulationProvider } from "@shadow-self/shared";
import { AlertTriangle, Download, Sparkles, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { PROVIDER_LABELS, clearAiSettings, loadAiSettings, saveAiSettings, type AiSettings } from "../lib/aiSettings.js";
import { useHabitStore } from "../store/habitStore.js";

export function Settings() {
  const exportData = useHabitStore((state) => state.exportData);
  const importData = useHabitStore((state) => state.importData);
  const reset = useHabitStore((state) => state.reset);
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [ai, setAi] = useState<AiSettings>(loadAiSettings);
  const [confirmingReset, setConfirmingReset] = useState(false);

  function handleExport() {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "shadow-self-logs.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File | undefined) {
    if (!file) {
      return;
    }

    const ok = importData(await file.text());
    setMessage(ok ? "Backup restored. Your dashboard is updated." : "That file is not a valid Shadow Self backup.");
  }

  function handleSaveAi() {
    saveAiSettings(ai);
    setMessage(ai.apiKey ? `${PROVIDER_LABELS[ai.provider]} key saved.` : "AI key removed — built-in summaries will be used.");
  }

  function handleReset() {
    reset();
    setConfirmingReset(false);
    setMessage("All logs deleted.");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Settings</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Your data lives only in this browser. Back it up, restore it, or start over.
        </p>
      </header>

      <section className="rounded-md border border-line bg-card p-4">
        <h2 className="font-semibold">Backup and restore</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Download a copy of your logged days, or restore them on another device or browser.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            <Download size={17} aria-hidden="true" />
            Download my data
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-card px-4 text-sm font-semibold text-ink transition hover:border-line-strong"
          >
            <Upload size={17} aria-hidden="true" />
            Restore a backup
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              void handleImport(event.currentTarget.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </div>
      </section>

      <section className="rounded-md border border-line bg-card p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <Sparkles size={17} aria-hidden="true" className="text-accent" />
          AI narration (optional)
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Pick a provider and paste your API key to have an AI write your simulation summary. Leave it empty
          and the app writes a built-in summary instead — everything still works.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            <span className="block h-5 whitespace-nowrap">Provider</span>
            <select
              value={ai.provider}
              onChange={(event) => setAi({ ...ai, provider: event.currentTarget.value as SimulationProvider })}
              className="h-11 rounded-md border border-line bg-card px-3 text-sm text-ink"
            >
              {SIMULATION_PROVIDERS.map((provider) => (
                <option key={provider} value={provider}>
                  {PROVIDER_LABELS[provider]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            <span className="block h-5 whitespace-nowrap">API key</span>
            <input
              type="password"
              value={ai.apiKey}
              onChange={(event) => setAi({ ...ai, apiKey: event.currentTarget.value.trim() })}
              placeholder="sk-..."
              autoComplete="off"
              className="h-11 rounded-md border border-line bg-card px-3 text-sm text-ink placeholder:text-muted"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            <span className="block h-5 whitespace-nowrap">
              Model <span className="font-normal text-muted">(optional)</span>
            </span>
            <input
              type="text"
              value={ai.model}
              onChange={(event) => setAi({ ...ai, model: event.currentTarget.value.trim() })}
              placeholder="default"
              className="h-11 rounded-md border border-line bg-card px-3 text-sm text-ink placeholder:text-muted"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleSaveAi}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            Save AI settings
          </button>
          <button
            type="button"
            onClick={() => {
              clearAiSettings();
              setAi(loadAiSettings());
              setMessage("AI settings cleared.");
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-card px-4 text-sm font-semibold text-ink transition hover:border-line-strong"
          >
            Clear
          </button>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          The key stays in this browser — simulations call the provider directly, so no Shadow Self server
          is needed.
        </p>
      </section>

      <section className="rounded-md border border-warn-line bg-card p-4">
        <h2 className="font-semibold">Start over</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Deletes every logged day in this browser. Download a backup first if you want to keep it.
        </p>
        <button
          type="button"
          onClick={() => setConfirmingReset(true)}
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-warn-line bg-warn-soft px-4 text-sm font-semibold text-warn-ink transition hover:opacity-90"
        >
          <Trash2 size={17} aria-hidden="true" />
          Delete all my data
        </button>
      </section>

      {confirmingReset ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-warning-title"
          className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-4"
          onClick={() => setConfirmingReset(false)}
        >
          <div
            className="w-full max-w-sm rounded-md border border-warn-line bg-card p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-coral" size={22} aria-hidden="true" />
              <div>
                <h2 id="reset-warning-title" className="font-semibold">
                  Delete everything?
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  This permanently removes all logged days in this browser. Download a backup first if you
                  want to keep your history.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-card px-4 text-sm font-semibold text-ink transition hover:border-line-strong"
              >
                Keep my data
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-10 items-center justify-center rounded-md bg-coral px-4 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Yes, delete it all
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {message ? <p className="text-sm font-medium text-soft">{message}</p> : null}
    </div>
  );
}
