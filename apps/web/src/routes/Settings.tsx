import { Download, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useHabitStore } from "../store/habitStore.js";

export function Settings() {
  const exportData = useHabitStore((state) => state.exportData);
  const importData = useHabitStore((state) => state.importData);
  const reset = useHabitStore((state) => state.reset);
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  function handleReset() {
    if (window.confirm("Delete all logged days in this browser? This cannot be undone.")) {
      reset();
      setMessage("All logs deleted.");
    }
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

      <section className="rounded-md border border-warn-line bg-card p-4">
        <h2 className="font-semibold">Start over</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Deletes every logged day in this browser. Download a backup first if you want to keep it.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-warn-line bg-warn-soft px-4 text-sm font-semibold text-warn-ink transition hover:opacity-90"
        >
          <Trash2 size={17} aria-hidden="true" />
          Delete all my data
        </button>
      </section>

      {message ? <p className="text-sm font-medium text-soft">{message}</p> : null}
    </div>
  );
}
