import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "ink" | "outline" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  ink: "border-black/10 bg-primary text-primary-foreground hover:bg-zinc-800",
  outline: "border-border bg-background text-foreground hover:bg-zinc-50",
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
