import type { ReactNode } from "react";

import { Button } from "@/ui/Button";

type NoticeProps = {
  message: string;
  secondary: string;
  primary: string;
  onSecondary: () => void;
  onPrimary: () => void;
};

export function Notice({
  message,
  secondary,
  primary,
  onSecondary,
  onPrimary,
}: NoticeProps): ReactNode {
  return (
    <div
      className="fixed right-4 bottom-4 z-50 flex max-w-sm flex-wrap items-center gap-2 rounded-xl border border-border bg-white p-3 shadow-md"
      role="status"
    >
      <p className="min-w-0 flex-1 text-sm">{message}</p>
      <Button onClick={onSecondary} variant="outline">
        {secondary}
      </Button>
      <Button onClick={onPrimary}>{primary}</Button>
    </div>
  );
}
