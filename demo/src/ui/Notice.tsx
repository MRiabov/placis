import type { ReactNode } from "react";

import { Button } from "@/ui/Button";
import { noticeBox } from "@/ui/card";

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
      className={noticeBox(
        "fixed right-4 bottom-4 z-50 flex max-w-sm flex-wrap items-center gap-2 p-3",
      )}
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
