import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type ProjectCardProps = {
  title: string;
  description: string;
  image: string | null;
  className?: string;
  children?: ReactNode;
};

export function ProjectCard({
  title,
  description,
  image,
  className,
  children,
}: ProjectCardProps): ReactNode {
  return (
    <article
      className={cn(
        "rounded-[28px] border border-stone-200 bg-white p-2.5 shadow-sm",
        className,
      )}
    >
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
