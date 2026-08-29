import { type ReactNode, useEffect, useState } from "react";

import { photo } from "@/lib/fixtures";
import { siteHero, siteReviews, siteServices } from "@/lib/site-copy";
import { useOnboardingDev } from "@/pages/onboarding/onboarding-dev";
import { Button } from "@/ui/Button";
import { card } from "@/ui/card";

type GeneratedState = "unsigned" | "signed" | "paying" | "activating" | "paid";

export function GeneratedPage(): ReactNode {
  const { setExtraGroups } = useOnboardingDev();
  const [scene, setScene] = useState<GeneratedState>("unsigned");
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    setExtraGroups([
      {
        title: "Activation",
        tabs: [
          {
            id: "unsigned",
            label: "Not signed in",
            on: scene === "unsigned",
            onSelect: () => {
              setScene("unsigned");
              setPanelOpen(false);
            },
          },
          {
            id: "signed",
            label: "Signed in",
            on:
              scene === "signed" ||
              scene === "paying" ||
              scene === "activating",
            onSelect: () => {
              setScene("signed");
              setPanelOpen(true);
            },
          },
          {
            id: "paid",
            label: "Paid",
            on: scene === "paid",
            onSelect: () => {
              window.location.assign(
                "/cms/website?publication=1&from=activation",
              );
            },
          },
        ],
      },
    ]);
    return () => setExtraGroups([]);
  }, [setExtraGroups, scene]);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-site-hero px-8 py-4 text-site-hero-fg">
          <b>Bellfield Roofing</b>
          <span className="text-sm">Home · Services · Reviews · Contact</span>
          <span>01 555 0199</span>
        </div>
        <div className="bg-site-hero px-8 py-20 text-site-hero-fg">
          <p className="text-xs tracking-[0.12em] uppercase">
            {siteHero.kicker}
          </p>
          <h1 className="mt-2 text-4xl font-semibold">{siteHero.headline}</h1>
          <p className="mt-4 max-w-lg text-sm opacity-80">{siteHero.lede}</p>
          <Button className="mt-6">Get a quote</Button>
        </div>
        <section className="p-8">
          <h2 className="text-lg font-semibold">Services</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            {siteServices.map((item, index) => (
              <article key={item.title}>
                <img
                  alt=""
                  className="h-32 w-full rounded-lg object-cover"
                  src={photo(index)}
                />
                <h3 className="mt-2 text-sm font-medium">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.blurb}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="bg-zinc-50 p-8">
          <h2 className="text-lg font-semibold">Google reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ★★★★★ 4.9 · 86 Google reviews
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {siteReviews.slice(0, 2).map((review) => (
              <article className={card("p-4")} key={review.name}>
                <div className="flex items-center gap-2">
                  <img
                    alt=""
                    className="size-10 rounded-full object-cover"
                    src={photo(review.photo)}
                  />
                  <div>
                    <b className="block text-sm">{review.name}</b>
                    <span className="text-xs text-muted-foreground">
                      {review.meta}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-amber-700">
                  {review.stars} {review.when}
                </p>
                <p className="mt-1 text-sm">{review.quote}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
      {scene === "paid" ? null : (
        <ActivationStrip
          panelOpen={panelOpen}
          scene={scene}
          onClose={() => setPanelOpen(false)}
          onOpen={() => setPanelOpen(true)}
          onPay={() => {
            setScene("paying");
            window.setTimeout(() => {
              setScene("activating");
              window.setTimeout(() => {
                window.location.assign(
                  "/cms/website?publication=1&from=activation",
                );
              }, 900);
            }, 900);
          }}
          onSignIn={() => setScene("signed")}
        />
      )}
    </div>
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
  scene: GeneratedState;
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

function ActivationStrip({
  panelOpen,
  scene,
  onClose,
  onOpen,
  onPay,
  onSignIn,
}: {
  panelOpen: boolean;
  scene: GeneratedState;
  onClose: () => void;
  onOpen: () => void;
  onPay: () => void;
  onSignIn: () => void;
}): ReactNode {
  return (
    <aside
      aria-label="Website activation"
      className="z-40 shrink-0 border-t border-stone-200 bg-white shadow-[0_-18px_48px_rgb(19_18_10/10%)]"
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
            ? "mx-auto grid w-[min(72rem,calc(100%-2.5rem))] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-4 py-3.5"
            : "mx-auto grid w-[min(72rem,calc(100%-2.5rem))] grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-5 gap-y-4 py-3.5"
        }
      >
        {panelOpen ? null : (
          <img
            alt="placis"
            className="h-10 w-[101px]"
            height={40}
            src="/placis-mark.png"
            width={101}
          />
        )}
        <div className="grid min-w-0 gap-0.5">
          <b className="text-[15px] font-semibold tracking-tight">
            This website is ready
          </b>
          <span className="text-[13px] text-muted-foreground">
            One-time · then about €50 / month
          </span>
        </div>
        {panelOpen ? null : (
          <p className="m-0 grid gap-px text-right">
            <b className="text-lg font-semibold tracking-tight">EUR 4,900</b>
            <span className="text-xs text-muted-foreground">one-time</span>
          </p>
        )}
        {panelOpen ? (
          <Button
            className="h-11 w-max justify-self-end px-[18px]"
            onClick={onClose}
            variant="outline"
          >
            Close
          </Button>
        ) : (
          <Button
            className="h-11 w-max justify-self-end px-[18px]"
            onClick={onOpen}
          >
            Activate this website
          </Button>
        )}
      </div>
    </aside>
  );
}
