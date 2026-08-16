import type { ReactNode } from "react";

export type PlaceholderViewProps = {
  description: string;
  title: string;
};

export function PlaceholderView({
  title,
  description,
}: PlaceholderViewProps): ReactNode {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="mt-6 rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        This surface arrives with the next CMS port batch.
      </div>
    </section>
  );
}
