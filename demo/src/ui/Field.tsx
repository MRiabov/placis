import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";
import { card, onbCard } from "@/ui/card";

const controlClass =
  "w-full min-w-0 min-h-11 rounded-lg border border-border bg-zinc-50 px-3 py-2.5 text-sm leading-[1.4] text-foreground outline-none placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

type FieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
  note?: string;
};

export function Field({
  label,
  children,
  className,
  note,
}: FieldProps): ReactNode {
  return (
    <div className={cn("grid gap-2", className)}>
      <span className="text-[13px] font-normal tracking-tight text-zinc-600">
        {label}
      </span>
      {children}
      {note ? (
        <p className="text-xs leading-snug text-muted-foreground">{note}</p>
      ) : null}
    </div>
  );
}

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>): ReactNode {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>): ReactNode {
  return (
    <textarea
      className={cn(controlClass, "min-h-24 resize-y", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>): ReactNode {
  return <select className={cn(controlClass, className)} {...props} />;
}

type PanelProps = {
  title: string;
  hint?: string;
  children: ReactNode;
};

export function Panel({ title, hint, children }: PanelProps): ReactNode {
  return (
    <section className={card("grid gap-[18px] p-5")}>
      <div>
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        {hint ? (
          <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function OnbPanel({ title, hint, children }: PanelProps): ReactNode {
  return (
    <section className={onbCard()}>
      <div className="grid gap-0.5">
        <h3 className="text-xl leading-[1.2] font-semibold tracking-tight">
          {title}
        </h3>
        {hint ? (
          <p className="m-0 text-[13px] leading-normal text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export { controlClass };
