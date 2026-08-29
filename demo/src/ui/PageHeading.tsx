import { PanelLeft } from "lucide-react";
import type { ReactNode } from "react";

type PageHeadingProps = {
  title: string;
  onOpenDestinations: () => void;
  actions?: ReactNode;
};

export function PageHeading({
  title,
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
        <PanelLeft className="size-4" />
      </button>
      <h1 className="text-[21px] font-semibold tracking-tight">{title}</h1>
      {actions}
    </div>
  );
}
