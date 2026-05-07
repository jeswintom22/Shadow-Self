import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="flex min-h-[360px] flex-col items-center justify-center rounded-md border border-dashed border-[#c9ced8] bg-white px-6 py-12 text-center">
      <div className="mb-4 text-5xl" aria-hidden="true">
        🪞
      </div>
      <h1 className="text-2xl font-semibold tracking-normal text-[#202124]">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#626976]">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}
