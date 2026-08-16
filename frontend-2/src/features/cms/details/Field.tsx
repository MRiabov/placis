import type { ReactNode } from "react";

export type FieldProps = {
  children: ReactNode;
  label: string;
};

export function Field({ children, label }: FieldProps): ReactNode {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: control passed as children, ported from the frozen old app.
    <label className="grid min-w-0 gap-1.5">
      <span className="font-semibold text-cms-muted text-[11px] uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
