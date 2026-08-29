import { type ReactNode, useEffect, useState } from "react";

import { photo } from "@/lib/fixtures";
import { siteHero, siteReviews, siteServices } from "@/lib/site-copy";
import { useOnboardingDev } from "@/pages/onboarding/onboarding-dev";
import { Button } from "@/ui/Button";

type GeneratedState = "unsigned" | "signed" | "paying" | "activating" | "paid";

export function GeneratedPage(): ReactNode {
  const { setExtraGroups } = useOnboardingDev();
  const [state, setState] = useState<GeneratedState>("unsigned");
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    setExtraGroups([
      {
        title: "Activation",
        tabs: [
          {
            id: "unsigned",
            label: "Not signed in",
            on: state === "unsigned",
            onSelect: () => {
              setState("unsigned");
              setPanelOpen(true);
            },
          },
          {
            id: "signed",
            label: "Signed in",
            on:
              state === "signed" ||
              state === "paying" ||
              state === "activating",
            onSelect: () => {
              setState("signed");
              setPanelOpen(true);
            },
          },
          {
            id: "paid",
            label: "Paid",
            on: state === "paid",
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
  }, [setExtraGroups, state]);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1f2933] px-8 py-4 text-[#f5f1ea]">
          <b>Bellfield Roofing</b>
          <span className="text-sm">Home · Services · Reviews · Contact</span>
          <span>01 555 0199</span>
        </div>
        <div className="bg-[#1f2933] px-8 py-20 text-[#f5f1ea]">
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
              <article
                className="rounded-xl border border-border bg-white p-4"
                key={review.name}
              >
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
      {state === "paid" ? null : (
        <div className="border-t border-border bg-white px-4 py-3">
          {panelOpen ? (
            <div className="mb-3 grid gap-2 rounded-xl border border-border p-4">
              <img
                alt="placis"
                className="h-8 w-auto justify-self-start"
                src="/placis-mark.png"
              />
              {state === "unsigned" ? (
                <>
                  <h2 className="text-lg font-semibold">
                    Activate this website
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Create an account, then pay. Whoever pays becomes the owner.
                    The website stays unpublished until you publish it later.
                  </p>
                  <p>
                    <b>EUR 4,900</b> <span className="text-sm">one-time</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Then about €50 / month to keep editing and hosting.
                  </p>
                  <Button
                    className="justify-self-start"
                    onClick={() => setState("signed")}
                  >
                    Create account
                  </Button>
                </>
              ) : null}
              {state === "signed" ? (
                <>
                  <h2 className="text-lg font-semibold">Pay to activate</h2>
                  <p className="text-sm text-muted-foreground">
                    Signed in. Checkout is tied to this account.
                  </p>
                  <p>
                    <b>EUR 4,900</b> <span className="text-sm">one-time</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Then about €50 / month to keep editing and hosting.
                  </p>
                  <Button
                    className="justify-self-start"
                    onClick={() => {
                      setState("paying");
                      window.setTimeout(() => {
                        setState("activating");
                        window.setTimeout(() => {
                          window.location.assign(
                            "/cms/website?publication=1&from=activation",
                          );
                        }, 900);
                      }, 900);
                    }}
                  >
                    Pay EUR 4,900
                  </Button>
                </>
              ) : null}
              {state === "paying" ? (
                <>
                  <h2 className="text-lg font-semibold">Opening checkout</h2>
                  <p className="text-sm text-muted-foreground">
                    Stripe checkout for EUR 4,900. This mock does not charge a
                    card.
                  </p>
                </>
              ) : null}
              {state === "activating" ? (
                <>
                  <h2 className="text-lg font-semibold">Payment received</h2>
                  <p className="text-sm text-muted-foreground">
                    Opening the website editor…
                  </p>
                </>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img alt="placis" className="h-8" src="/placis-mark.png" />
              <div>
                <p className="text-sm font-medium">This website is ready</p>
                <p className="text-xs text-muted-foreground">
                  One-time · then about €50 / month
                </p>
              </div>
            </div>
            <p className="text-sm">
              <b>EUR 4,900</b>{" "}
              <span className="text-muted-foreground">one-time</span>
            </p>
            {panelOpen ? (
              <Button onClick={() => setPanelOpen(false)} variant="outline">
                Close
              </Button>
            ) : (
              <Button onClick={() => setPanelOpen(true)}>
                Activate this website
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
