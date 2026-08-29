import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type PageHeadingProps = {
  title: string;
  narrowTitle?: string;
  titleClassName?: string;
  onOpenDestinations: () => void;
  actions?: ReactNode;
};

export function PageHeading({
  title,
  narrowTitle,
  titleClassName,
  onOpenDestinations,
  actions,
}: PageHeadingProps): ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        aria-label="Open destinations"
        className="grid size-9 place-items-center rounded-lg text-foreground min-[1101px]:hidden"
        onClick={onOpenDestinations}
        type="button"
      >
        <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
          <rect
            fill="none"
            height="18"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.6"
            width="18"
            x="3"
            y="3"
          />
          <path
            d="M9 3v18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      </button>
      {narrowTitle ? (
        <h1
          className={cn(
            "text-[1.375rem] font-medium tracking-tight min-[1101px]:hidden",
            titleClassName,
          )}
        >
          {narrowTitle}
        </h1>
      ) : null}
      <h1
        className={cn(
          narrowTitle
            ? "hidden text-[21px] font-semibold tracking-tight min-[1101px]:block"
            : "text-[21px] font-semibold tracking-tight",
          titleClassName,
        )}
      >
        {title}
      </h1>
      {actions}
    </div>
  );
}
