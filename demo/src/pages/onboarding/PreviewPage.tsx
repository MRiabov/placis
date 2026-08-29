import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { photo } from "@/lib/fixtures";
import { siteHero, siteReviews, siteServices } from "@/lib/site-copy";
import { useOnboardingDev } from "@/pages/onboarding/onboarding-dev";
import { Button } from "@/ui/Button";

const slides = ["hero", "services", "reviews"] as const;

export function PreviewPage(): ReactNode {
  const navigate = useNavigate();
  const { setExtraGroups } = useOnboardingDev();
  const shot = new URLSearchParams(window.location.search).get("shot") === "1";
  const [slide, setSlide] = useState<(typeof slides)[number]>("hero");
  const [seconds, setSeconds] = useState(15);
  const opening = seconds <= 2;

  useEffect(() => {
    setExtraGroups([
      {
        title: "Wait",
        tabs: slides.map((item) => ({
          id: item,
          label: item[0].toUpperCase() + item.slice(1),
          on: slide === item,
          onSelect: () => setSlide(item),
        })),
      },
    ]);
    return () => setExtraGroups([]);
  }, [setExtraGroups, slide]);

  useEffect(() => {
    if (shot) {
      return;
    }
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const carousel = window.setInterval(() => {
      if (reduce) {
        return;
      }
      setSlide(
        (current) => slides[(slides.indexOf(current) + 1) % slides.length],
      );
    }, 2000);
    const tick = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(tick);
          window.clearInterval(carousel);
          void navigate({ to: "/onboarding/generated" });
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => {
      window.clearInterval(carousel);
      window.clearInterval(tick);
    };
  }, [navigate, shot]);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-auto bg-zinc-50 p-6">
        <div className="mb-3 text-center">
          <h1 className="text-lg font-semibold">
            We’re putting your website together
          </h1>
          <p className="text-sm text-muted-foreground">
            This usually takes about 15 seconds. Then we’ll open the site.
          </p>
        </div>
        <div className="mx-auto max-w-3xl overflow-hidden rounded-xl bg-[#1f2933] text-[#f5f1ea] shadow-sm">
          <p className="px-4 pt-3 text-xs text-white/60">
            bellfield-roofing-dublin.preview.placis.com
          </p>
          {slide === "hero" ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm">
                <b>Bellfield Roofing</b>
                <span>Home</span>
                <span>Services</span>
                <span>Contact</span>
              </div>
              <div className="px-8 py-16">
                <p className="text-xs tracking-[0.12em] uppercase">
                  {siteHero.kicker}
                </p>
                <h2 className="mt-2 text-3xl font-semibold">
                  {siteHero.headline}
                </h2>
                <p className="mt-3 text-sm opacity-80">{siteHero.lede}</p>
              </div>
            </div>
          ) : null}
          {slide === "services" ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm">
                <b>Bellfield Roofing</b>
                <span>Home</span>
                <span>Services</span>
                <span>Contact</span>
              </div>
              <div className="grid gap-4 p-8 sm:grid-cols-3">
                {siteServices.map((item, index) => (
                  <div key={item.title}>
                    <img
                      alt=""
                      className="h-24 w-full rounded-lg object-cover"
                      src={photo(index)}
                    />
                    <h3 className="mt-2 text-sm font-medium">{item.title}</h3>
                    <p className="text-xs text-white/70">{item.blurb}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {slide === "reviews" ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm">
                <b>Bellfield Roofing</b>
                <span>Home</span>
                <span>Services</span>
                <span>Contact</span>
              </div>
              <div className="grid gap-4 p-8">
                {siteReviews.slice(0, 2).map((review) => (
                  <article key={review.name}>
                    <div className="flex items-center gap-2">
                      <img
                        alt=""
                        className="size-8 rounded-full object-cover"
                        src={photo(review.photo)}
                      />
                      <div>
                        <b className="block text-sm">{review.name}</b>
                        <span className="text-xs text-white/70">
                          {review.meta}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-amber-300">
                      {review.stars} {review.when}
                    </p>
                    <p className="mt-1 text-sm">{review.quote}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <ol className="mx-auto mt-6 grid max-w-md gap-3 text-sm">
          <TimeRow
            active={false}
            done
            title="Found the business"
            hint="Company and Maps listing attached"
          />
          <TimeRow
            active={false}
            done
            title="Answered the questions"
            hint="Your answers are saved"
          />
          <TimeRow
            active={false}
            done
            title="Started the website"
            hint="Pages are in place"
          />
          <TimeRow
            active={!opening}
            done={false}
            title="Writing the pages"
            hint="Home, services, and reviews filling in"
          />
          <TimeRow
            active={opening}
            done={false}
            title="Opening the site"
            hint="Ready when writing finishes, or after 15 seconds"
          />
        </ol>
      </div>
      <div className="flex items-center justify-between border-t border-border bg-white p-3">
        <span className="text-sm text-muted-foreground">
          {opening
            ? "Opening your website…"
            : `Writing your website · ${seconds} seconds left`}
        </span>
        <Button
          onClick={() => {
            void navigate({ to: "/onboarding/generated" });
          }}
        >
          Skip generation
        </Button>
      </div>
    </div>
  );
}

function TimeRow({
  title,
  hint,
  done,
  active,
}: {
  title: string;
  hint: string;
  done: boolean;
  active: boolean;
}): ReactNode {
  return (
    <li
      className={cn(
        "grid gap-0.5",
        active ? "text-foreground" : "text-muted-foreground",
        done ? "text-foreground" : "",
      )}
    >
      <b className="font-medium">{title}</b>
      <span className="text-xs">{hint}</span>
    </li>
  );
}
