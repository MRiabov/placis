import type { ReactNode } from "react";

import { Button } from "@/ui/Button";
import { card } from "@/ui/card";

type CompleteWarningProps = {
  title: string;
  children: ReactNode;
  primary: string;
  secondary: string;
  onPrimary: () => void;
  onSecondary: () => void;
  onDismiss: () => void;
};

export function CompleteWarning({
  title,
  children,
  primary,
  secondary,
  onPrimary,
  onSecondary,
  onDismiss,
}: CompleteWarningProps): ReactNode {
  return (
    <div
      aria-labelledby="complete-warning-title"
      aria-modal="true"
      className="fixed inset-0 z-[90] grid place-items-center bg-black/30 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onDismiss();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onDismiss();
        }
      }}
      role="dialog"
    >
      <div className={card("w-full max-w-md p-5 shadow-card")}>
        <h2 className="text-lg font-semibold" id="complete-warning-title">
          {title}
        </h2>
        <div className="mt-2 text-sm text-muted-foreground">{children}</div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button onClick={onSecondary} variant="outline">
            {secondary}
          </Button>
          <Button onClick={onPrimary}>{primary}</Button>
        </div>
      </div>
    </div>
  );
}
