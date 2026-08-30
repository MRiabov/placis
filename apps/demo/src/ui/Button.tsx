import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "ink" | "outline" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  // Matches the Placis-web prompt controls: a clear hairline outline on both
  // themes, with the ink action reading as a raised, deliberate submit.
  ink: "border-stone-200 bg-primary text-primary-foreground transition hover:bg-zinc-800 dark:border-white/20 dark:hover:bg-zinc-800",
  outline:
    "border-stone-200 bg-background text-foreground transition hover:bg-zinc-50 dark:border-white/20 dark:hover:bg-zinc-900",
  danger: "border-red-500 bg-background text-red-700 hover:bg-red-50",
};

export function Button({
  variant = "ink",
  className,
  type = "button",
  children,
  ...props
}: ButtonProps): ReactNode {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3.5 text-sm font-normal disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
