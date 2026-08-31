import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

const trail = [
  { angle: 0, opacity: 1 },
  { angle: 60, opacity: 0.72 },
  { angle: 120, opacity: 0.42 },
  { angle: 180, opacity: 0.18 },
  { angle: 240, opacity: 0.08 },
  { angle: 300, opacity: 0.08 },
] as const;

export function DotSpinner({ className }: { className?: string }): ReactNode {
  return (
    <span
      aria-label="Writing"
      className={cn(
        "relative inline-grid size-3.5 place-items-center text-muted-foreground animate-dot-spin motion-reduce:animate-none",
        className,
      )}
      role="status"
    >
      {trail.map((dot) => (
        <span
          className="absolute top-1/2 left-1/2 size-0.5 rounded-full bg-current"
          key={dot.angle}
          style={{
            opacity: dot.opacity,
            transform: `translate(-50%, -50%) rotate(${dot.angle}deg) translateY(-5px)`,
          }}
        />
      ))}
    </span>
  );
}
