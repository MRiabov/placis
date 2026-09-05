import { Archive as ArchiveIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type ProjectCardProps = {
  title: string;
  description: string;
  image: string | null;
  className?: string;
  onArchive?: () => void;
  children?: ReactNode;
};

export function ProjectCard({
  title,
  description,
  image,
  className,
  onArchive,
  children,
}: ProjectCardProps): ReactNode {
  return (
    <article
      className={cn(
        "relative rounded-[28px] border border-stone-200 bg-white p-2.5 shadow-sm",
        className,
      )}
    >
      {onArchive ? (
        <button
          aria-label="Archive"
          className="absolute top-1.5 right-1.5 z-[1] grid size-7 place-items-center rounded-lg bg-white/90 text-red-700 hover:bg-red-50"
          onClick={onArchive}
          type="button"
        >
          <ArchiveIcon
            aria-hidden="true"
            className="size-4"
            strokeWidth={1.6}
          />
        </button>
      ) : null}
      {image ? (
        <img
          alt=""
          className="h-44 w-full rounded-[18px] bg-zinc-100 object-cover object-[50%_32%]"
          src={image}
        />
      ) : (
        <span className="block h-44 rounded-[18px] bg-zinc-100" />
      )}
      <div className="grid gap-1.5 px-2 pt-3 pb-2">
        <b className="text-[15px] font-semibold tracking-tight">{title}</b>
        <span className="text-[13px] leading-snug text-muted-foreground">
          {description}
        </span>
        {children}
      </div>
    </article>
  );
}
