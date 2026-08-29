import type { ReactNode } from "react";

import { DevStrip } from "@/dev/DevStrip";
import { useCmsLayout } from "@/shell/CmsShell";
import { PageHeading } from "@/ui/PageHeading";

export function BillingPage(): ReactNode {
  const { openDestinations } = useCmsLayout();

  return (
    <>
      <DevStrip
        groups={[
          {
            title: "Usage",
            tabs: [
              {
                id: "stub",
                label:
                  "Stub usage scene. Billing docs will be rewritten completely.",
                onSelect: () => undefined,
              },
            ],
          },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <PageHeading onOpenDestinations={openDestinations} title="Usage" />
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          The billing docs are a stub and will be rewritten completely. This
          scene is not a finished usage screen. Left-nav place (top-level vs
          Profile child) is unset until that rewrite. Do not port placis-web
          subscription-shelf. There is no billing.html.
        </p>
      </div>
    </>
  );
}
