import { type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { photo } from "@/lib/fixtures";
import { siteHero, siteReviews, siteServices } from "@/lib/site-copy";
import {
  type ActivationScene,
  ActivationStrip,
} from "@/pages/onboarding/ActivationStrip";
import { useOnboardingDev } from "@/pages/onboarding/onboarding-dev";
import { Button } from "@/ui/Button";
import {
  AssistantLaunch,
  AssistantSession,
  assistantOrbVars,
  CmsAssistantProvider,
  useCmsAssistant,
} from "@/ui/CmsAssistant";
import { card } from "@/ui/card";

const pageTree = [
  { id: "home", title: "Home" },
  {
    id: "services",
    title: "Services",
    children: siteServices.map((item) => ({
      id: `service:${item.title}`,
      title: item.title,
    })),
  },
  { id: "contact", title: "Contact" },
  { id: "privacy", title: "Privacy" },
  { id: "terms", title: "Terms" },
] as const;

type PreviewPageId = string;

const shareHost = "bellfield-roofing-dublin.preview.placis.com";

function pageTitle(page: PreviewPageId): string {
  for (const node of pageTree) {
    if (node.id === page) {
      return node.title;
    }
    if ("children" in node) {
      const child = node.children.find((item) => item.id === page);
      if (child) {
        return child.title;
      }
    }
  }
  return "Home";
}

export function PreviewAndEditPage(): ReactNode {
  return (
    <CmsAssistantProvider startText>
      <PreviewAndEditInner />
    </CmsAssistantProvider>
  );
}

function PreviewAndEditInner(): ReactNode {
  const { setExtraGroups } = useOnboardingDev();
  const { open: assistantOpen, voiceOn } = useCmsAssistant();
  const [page, setPage] = useState<PreviewPageId>("home");
  const [listOpen, setListOpen] = useState(false);
  const [scene, setScene] = useState<ActivationScene>("unsigned");
  const [panelOpen, setPanelOpen] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    setExtraGroups([
      {
        title: "Website preview",
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
  }, [scene, setExtraGroups]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div
        className={cn(
          "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          assistantOrbVars,
          voiceOn && assistantOpen ? "is-voice" : "",
        )}
        data-editor-canvas
      >
        <UnpaidCanvas page={page} onPage={setPage} />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3">
          <div className="pointer-events-auto">
            <PageList
              listOpen={listOpen}
              page={page}
              onOpen={setListOpen}
              onPage={(next) => {
                setPage(next);
                setListOpen(false);
              }}
            />
          </div>
          <Button
            className="pointer-events-auto shadow-prompt"
            onClick={() => setShared(true)}
            type="button"
            variant="outline"
          >
            Share
          </Button>
        </div>
        {shared ? (
          <p className="pointer-events-none absolute inset-x-3 top-14 z-30 rounded-lg border border-border bg-background/95 px-3 py-2 text-sm shadow-prompt">
            Shared to {shareHost}
          </p>
        ) : null}
        <AssistantLaunch className="absolute right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] z-30" />
        <AssistantSession
          onSignIn={() => setScene("signed")}
          signedIn={scene !== "unsigned"}
          unpaid
        />
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

function PageList({
  listOpen,
  page,
  onOpen,
  onPage,
}: {
  listOpen: boolean;
  page: PreviewPageId;
  onOpen: (open: boolean | ((value: boolean) => boolean)) => void;
  onPage: (id: PreviewPageId) => void;
}): ReactNode {
  return (
    <div className="relative">
      <Button
        aria-expanded={listOpen}
        aria-haspopup="true"
        className="shadow-prompt"
        onClick={() => onOpen((open) => !open)}
        type="button"
        variant="outline"
      >
        {pageTitle(page)}
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
        <ul className="absolute top-full left-0 z-40 mt-1 min-w-52 rounded-lg border border-border bg-background py-1 shadow-sm">
          {pageTree.map((node) => (
            <li key={node.id}>
              <button
                className={cn(
                  "block w-full px-3 py-1.5 text-left text-sm hover:bg-zinc-50",
                  node.id === page ? "font-semibold" : "",
                )}
                onClick={() => onPage(node.id)}
                type="button"
              >
                {node.title}
              </button>
              {"children" in node
                ? node.children.map((child) => (
                    <button
                      className={cn(
                        "block w-full px-3 py-1.5 pl-7 text-left text-sm text-muted-foreground hover:bg-zinc-50 hover:text-foreground",
                        child.id === page
                          ? "font-semibold text-foreground"
                          : "",
                      )}
                      key={child.id}
                      onClick={() => onPage(child.id)}
                      type="button"
                    >
                      {child.title}
                    </button>
                  ))
                : null}
            </li>
          ))}
        </ul>
      ) : null}
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
  const service = siteServices.find((item) => page === `service:${item.title}`);
  return (
    <div className="relative z-0 min-h-0 flex-1 overflow-auto bg-white pb-28">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-site-hero px-8 pt-16 pb-4 text-site-hero-fg">
        <b>Bellfield Roofing</b>
        <nav className="flex flex-wrap gap-3 text-sm">
          {pageTree
            .filter((item) => item.id !== "privacy" && item.id !== "terms")
            .map((item) => (
              <button
                className={cn(
                  "underline-offset-4 hover:underline",
                  item.id === page ||
                    (item.id === "services" && page.startsWith("service:"))
                    ? "underline"
                    : "",
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
      {service ? <ServiceBody service={service} /> : null}
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

function ServiceBody({
  service,
}: {
  service: (typeof siteServices)[number];
}): ReactNode {
  const index = siteServices.indexOf(service);
  return (
    <section className="p-8">
      <h1 className="text-2xl font-semibold">{service.title}</h1>
      <img
        alt=""
        className="mt-4 h-48 w-full max-w-xl rounded-lg object-cover"
        src={photo(index)}
      />
      <p className="mt-3 max-w-lg text-sm text-muted-foreground">
        {service.blurb}
      </p>
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
