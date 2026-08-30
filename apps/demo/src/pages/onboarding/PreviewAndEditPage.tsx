import { type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { photo } from "@/lib/fixtures";
import { siteHero, siteReviews, siteServices } from "@/lib/site-copy";
import { useOnboardingDev } from "@/pages/onboarding/onboarding-dev";
import { Button } from "@/ui/Button";
import {
  AssistantLaunch,
  AssistantSession,
  CmsAssistantProvider,
} from "@/ui/CmsAssistant";
import { card } from "@/ui/card";

const pages = [
  { id: "home", title: "Home" },
  { id: "services", title: "Services" },
  { id: "contact", title: "Contact" },
  { id: "privacy", title: "Privacy" },
  { id: "terms", title: "Terms" },
] as const;

type PreviewPageId = (typeof pages)[number]["id"];
type AuthScene = "unsigned" | "signed" | "paid";

const shareHost = "bellfield-roofing-dublin.preview.placis.com";

export function PreviewAndEditPage(): ReactNode {
  return (
    <CmsAssistantProvider>
      <PreviewAndEditInner />
    </CmsAssistantProvider>
  );
}

function PreviewAndEditInner(): ReactNode {
  const { setExtraGroups } = useOnboardingDev();
  const [page, setPage] = useState<PreviewPageId>("home");
  const [listOpen, setListOpen] = useState(false);
  const [scene, setScene] = useState<AuthScene>("signed");
  const [shared, setShared] = useState(false);
  const [paying, setPaying] = useState(false);
  const current = pages.find((item) => item.id === page) ?? pages[0];

  useEffect(() => {
    setExtraGroups([
      {
        title: "Website preview",
        tabs: [
          {
            id: "unsigned",
            label: "Not signed in",
            on: scene === "unsigned",
            onSelect: () => setScene("unsigned"),
          },
          {
            id: "signed",
            label: "Signed in",
            on: scene === "signed",
            onSelect: () => setScene("signed"),
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
  }, [scene, setExtraGroups]);

  function pay(): void {
    if (scene === "unsigned") {
      setScene("signed");
      return;
    }
    setPaying(true);
    window.setTimeout(() => {
      window.location.assign("/cms/website?publication=1&from=activation");
    }, 900);
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3 py-2">
        <div className="relative">
          <Button
            aria-expanded={listOpen}
            aria-haspopup="listbox"
            onClick={() => setListOpen((open) => !open)}
            type="button"
            variant="outline"
          >
            {current.title}
            <svg
              aria-hidden="true"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              viewBox="0 0 24 24"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </Button>
          {listOpen ? (
            <ul className="absolute top-full left-0 z-30 mt-1 min-w-44 rounded-lg border border-border bg-background py-1 shadow-sm">
              {pages.map((item) => (
                <li key={item.id}>
                  <button
                    className={cn(
                      "block w-full px-3 py-1.5 text-left text-sm hover:bg-zinc-50",
                      item.id === page ? "font-semibold" : "",
                    )}
                    onClick={() => {
                      setPage(item.id);
                      setListOpen(false);
                    }}
                    type="button"
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {paying ? (
            <span className="text-sm text-muted-foreground">
              Opening checkout…
            </span>
          ) : (
            <Button onClick={pay}>
              {scene === "unsigned" ? "Sign in to pay" : "Pay to activate"}
            </Button>
          )}
          <Button
            onClick={() => setShared(true)}
            type="button"
            variant="outline"
          >
            Share
          </Button>
          <AssistantLaunch />
        </div>
      </div>
      {shared ? (
        <p className="shrink-0 border-b border-border bg-zinc-50 px-3 py-2 text-sm">
          Shared to {shareHost}
        </p>
      ) : null}
      {scene === "unsigned" ? (
        <p className="shrink-0 border-b border-border bg-zinc-50 px-3 py-2 text-sm text-muted-foreground">
          You can look around. Sign in to send to Assistant or use Voice.
        </p>
      ) : null}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <UnpaidCanvas page={page} onPage={setPage} />
        <AssistantSession />
      </div>
    </div>
  );
}

function UnpaidCanvas({
  page,
  onPage,
}: {
  page: PreviewPageId;
  onPage: (id: PreviewPageId) => void;
}): ReactNode {
  return (
    <div className="h-full min-h-0 overflow-auto bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-site-hero px-8 py-4 text-site-hero-fg">
        <b>Bellfield Roofing</b>
        <nav className="flex flex-wrap gap-3 text-sm">
          {pages
            .filter((item) => item.id !== "privacy" && item.id !== "terms")
            .map((item) => (
              <button
                className={cn(
                  "underline-offset-4 hover:underline",
                  item.id === page ? "underline" : "",
                )}
                key={item.id}
                onClick={() => onPage(item.id)}
                type="button"
              >
                {item.title}
              </button>
            ))}
        </nav>
        <span>01 555 0199</span>
      </div>
      {page === "home" ? <HomeBody /> : null}
      {page === "services" ? <ServicesBody /> : null}
      {page === "contact" ? <SimpleBody title="Contact" /> : null}
      {page === "privacy" ? <SimpleBody title="Privacy" /> : null}
      {page === "terms" ? <SimpleBody title="Terms" /> : null}
      <footer className="flex flex-wrap justify-between gap-2 border-t border-border px-8 py-4 text-xs text-muted-foreground">
        <span>Bellfield Roofing · Dublin</span>
        <span className="flex gap-3">
          <button onClick={() => onPage("privacy")} type="button">
            Privacy
          </button>
          <button onClick={() => onPage("terms")} type="button">
            Terms
          </button>
        </span>
      </footer>
    </div>
  );
}

function HomeBody(): ReactNode {
  return (
    <>
      <div className="bg-site-hero px-8 py-20 text-site-hero-fg">
        <p className="text-xs tracking-[0.12em] uppercase">{siteHero.kicker}</p>
        <h1 className="mt-2 text-4xl font-semibold">{siteHero.headline}</h1>
        <p className="mt-4 max-w-lg text-sm opacity-80">{siteHero.lede}</p>
        <Button className="mt-6">Get a quote</Button>
      </div>
      <ServicesBody />
      <section className="bg-zinc-50 p-8">
        <h2 className="text-lg font-semibold">Google reviews</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {siteReviews.slice(0, 2).map((review) => (
            <article className={card("p-4")} key={review.name}>
              <div className="flex items-center gap-2">
                <img
                  alt=""
                  className="size-10 rounded-full object-cover"
                  src={photo(review.photo)}
                />
                <b className="text-sm">{review.name}</b>
              </div>
              <p className="mt-2 text-sm">{review.quote}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function ServicesBody(): ReactNode {
  return (
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
  );
}

function SimpleBody({ title }: { title: string }): ReactNode {
  return (
    <section className="p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-3 max-w-lg text-sm text-muted-foreground">
        Unpublished website page. Assistant can open this page even when it is
        not in the top menu.
      </p>
    </section>
  );
}
