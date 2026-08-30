import type { ReactNode } from "react";

import { Button } from "@/ui/Button";
import { card } from "@/ui/card";

export type ActivationScene =
  | "unsigned"
  | "signed"
  | "paying"
  | "activating"
  | "paid";

export function ActivationStrip({
  panelOpen,
  scene,
  onClose,
  onOpen,
  onPay,
  onSignIn,
}: {
  panelOpen: boolean;
  scene: ActivationScene;
  onClose: () => void;
  onOpen: () => void;
  onPay: () => void;
  onSignIn: () => void;
}): ReactNode {
  if (scene === "paid") {
    return null;
  }
  return (
    <aside
      aria-label="Website activation"
      className="z-40 shrink-0 border-t border-stone-200 bg-white px-3 shadow-[0_-18px_48px_rgb(19_18_10/10%)]"
    >
      {panelOpen ? (
        <div className="mx-auto grid w-[min(36rem,calc(100%-2.5rem))] max-h-[min(58vh,28rem)] gap-4 overflow-auto pt-5">
          <img
            alt="placis"
            className="h-10 w-[101px]"
            height={40}
            src="/placis-mark.png"
            width={101}
          />
          <ActivationCopy onPay={onPay} onSignIn={onSignIn} scene={scene} />
        </div>
      ) : null}
      <div
        className={
          panelOpen
            ? "mx-auto flex w-[min(72rem,calc(100%-1.5rem))] justify-end py-3"
            : "mx-auto flex w-[min(72rem,calc(100%-1.5rem))] flex-col gap-3 py-3 min-[640px]:grid min-[640px]:grid-cols-[auto_minmax(0,1fr)_auto_auto] min-[640px]:items-center min-[640px]:gap-x-5"
        }
      >
        {panelOpen ? null : (
          <>
            <div className="flex min-w-0 items-start gap-3 min-[640px]:contents">
              <img
                alt="placis"
                className="hidden h-10 w-[101px] shrink-0 min-[640px]:block"
                height={40}
                src="/placis-mark.png"
                width={101}
              />
              <div className="grid min-w-0 flex-1 gap-0.5">
                <b className="text-[15px] font-semibold tracking-tight">
                  This website is ready
                </b>
                <span className="text-[13px] text-muted-foreground">
                  One-time · then about €50 / month
                </span>
              </div>
              <p className="m-0 shrink-0 grid gap-px text-right">
                <b className="text-lg font-semibold tracking-tight">
                  EUR 4,900
                </b>
                <span className="text-xs text-muted-foreground">one-time</span>
              </p>
            </div>
            <Button
              className="h-11 w-full px-[18px] min-[640px]:w-max min-[640px]:justify-self-end"
              onClick={onOpen}
            >
              Activate this website
            </Button>
          </>
        )}
        {panelOpen ? (
          <Button
            className="h-11 w-full px-[18px] min-[640px]:w-max"
            onClick={onClose}
            variant="outline"
          >
            Close
          </Button>
        ) : null}
      </div>
    </aside>
  );
}

function PriceCard(): ReactNode {
  return (
    <>
      <div
        className={card(
          "mt-3.5 flex items-baseline justify-between gap-3 bg-zinc-50 px-4 py-3.5",
        )}
      >
        <b className="text-2xl font-semibold tracking-tight">EUR 4,900</b>
        <span className="text-[13px] text-muted-foreground">one-time</span>
      </div>
      <p className="mt-2 text-sm text-zinc-600">
        Then about €50 / month to keep editing and hosting.
      </p>
    </>
  );
}

function ActivationCopy({
  scene,
  onPay,
  onSignIn,
}: {
  scene: ActivationScene;
  onPay: () => void;
  onSignIn: () => void;
}): ReactNode {
  switch (scene) {
    case "unsigned":
      return (
        <>
          <div>
            <h2 className="m-0 text-xl font-semibold tracking-tight">
              Activate this website
            </h2>
            <p className="mt-2 text-sm leading-normal text-zinc-600">
              Create an account, then pay. Whoever pays becomes the owner. The
              website stays unpublished until you publish it later.
            </p>
            <PriceCard />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="h-11 px-[18px]" onClick={onSignIn}>
              Create account
            </Button>
          </div>
        </>
      );
    case "signed":
      return (
        <>
          <div>
            <h2 className="m-0 text-xl font-semibold tracking-tight">
              Pay to activate
            </h2>
            <p className="mt-2 text-sm leading-normal text-zinc-600">
              Signed in. Checkout is tied to this account.
            </p>
            <PriceCard />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="h-11 px-[18px]" onClick={onPay}>
              Pay EUR 4,900
            </Button>
          </div>
        </>
      );
    case "paying":
      return (
        <div>
          <h2 className="m-0 text-xl font-semibold tracking-tight">
            Opening checkout
          </h2>
          <p className="mt-2 text-sm leading-normal text-zinc-600">
            Stripe checkout for EUR 4,900. This mock does not charge a card.
          </p>
        </div>
      );
    case "activating":
      return (
        <div>
          <h2 className="m-0 text-xl font-semibold tracking-tight">
            Payment received
          </h2>
          <p className="mt-2 text-sm leading-normal text-zinc-600">
            Opening the website editor…
          </p>
        </div>
      );
    case "paid":
      return null;
  }
}
