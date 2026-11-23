import { Eclipse } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="flex min-h-[360px] flex-col items-center justify-center rounded-md border border-dashed border-line-strong bg-card px-6 py-12 text-center">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-accent-soft text-accent"
        aria-hidden="true"
      >
        <Eclipse size={26} />
      </div>
      <h1 className="text-2xl font-semibold tracking-normal text-ink">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}
