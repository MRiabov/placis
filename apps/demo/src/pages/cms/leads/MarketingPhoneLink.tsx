import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function MarketingPhoneLink({
  className,
  marketingPhone,
}: {
  className?: string;
  marketingPhone: string;
}): ReactNode {
  return (
    <a
      className={cn("hover:underline", className)}
      href={`tel:${marketingPhone.replace(/[^\d+]/g, "")}`}
    >
      {marketingPhone}
    </a>
  );
}
