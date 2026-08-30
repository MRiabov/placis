import { type ReactNode, useEffect, useState } from "react";

import { photo } from "@/lib/fixtures";
import { siteHero, siteReviews, siteServices } from "@/lib/site-copy";
import {
  type ActivationScene,
  ActivationStrip,
} from "@/pages/onboarding/ActivationStrip";
import { useOnboardingDev } from "@/pages/onboarding/onboarding-dev";
import { Button } from "@/ui/Button";
import { card } from "@/ui/card";

export function GeneratedPage(): ReactNode {
  const { setExtraGroups } = useOnboardingDev();
  const [scene, setScene] = useState<ActivationScene>("unsigned");
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
    </div>
  );
}
