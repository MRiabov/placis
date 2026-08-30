import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

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

type ServiceRow = { title: string; blurb: string };

type FollowSlot = "hero" | "services" | "contact";

const followBeats: Array<{
  page: PreviewPageId;
  slot: FollowSlot;
  hero?: typeof siteHero;
  services?: ServiceRow[];
  contact?: string;
}> = [
  {
    page: "home",
    slot: "hero",
    hero: {
      kicker: "Dublin emergency roofing",
      headline: "Emergency roof repairs, same day.",
      lede: "Storm damage and leaks across Dublin — call 01 555 0199.",
    },
  },
  {
    page: "services",
    slot: "services",
    services: [
      {
        title: "Roof repairs",
        blurb:
          "Same-day leak stops after Irish weather. No full strip unless you need one.",
      },
      {
        title: "New roofs",
        blurb: "Re-roofs with a workmanship guarantee on every job.",
      },
      {
        title: "Guttering",
        blurb: "Cleaning, replacement, and fascia upgrades.",
      },
    ],
  },
  {
    page: "contact",
    slot: "contact",
    contact:
      "Call 01 555 0199 for emergency roof repairs. We answer evenings and weekends.",
  },
];

const followFlash =
  "outline outline-dashed outline-amber-600 outline-offset-2 transition-[outline] duration-300";

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
  const [hero, setHero] = useState(siteHero);
  const [services, setServices] = useState<ServiceRow[]>(() =>
    siteServices.map((item) => ({ title: item.title, blurb: item.blurb })),
  );
  const [contact, setContact] = useState(
    "Unpublished website page. Assistant can open this page even when it is not in the top menu.",
  );
  const [followSlot, setFollowSlot] = useState<FollowSlot | null>(null);
  const beatRef = useRef(0);
  const followTimer = useRef(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  function applyFollowBeat(): void {
    const beat = followBeats[beatRef.current % followBeats.length];
    if (!beat) {
      return;
    }
    beatRef.current += 1;
    setPage(beat.page);
    if (beat.hero) {
      setHero(beat.hero);
    }
    if (beat.services) {
      setServices(beat.services);
    }
    if (beat.contact) {
      setContact(beat.contact);
    }
    setFollowSlot(beat.slot);
    canvasRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.clearTimeout(followTimer.current);
    followTimer.current = window.setTimeout(() => {
      setFollowSlot(null);
    }, 1600);
  }

  useEffect(() => {
    return () => window.clearTimeout(followTimer.current);
  }, []);

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
        <UnpaidCanvas
          canvasRef={canvasRef}
          contact={contact}
          followSlot={followSlot}
          hero={hero}
          page={page}
          services={services}
          onPage={setPage}
        />
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
          onSend={applyFollowBeat}
          onSignUp={() => setScene("signed")}
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
        onSignUp={() => setScene("signed")}
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
  canvasRef,
  contact,
  followSlot,
  hero,
  page,
  services,
  onPage,
}: {
  canvasRef: RefObject<HTMLDivElement | null>;
  contact: string;
  followSlot: FollowSlot | null;
  hero: typeof siteHero;
  page: PreviewPageId;
  services: ServiceRow[];
  onPage: (id: PreviewPageId) => void;
}): ReactNode {
  const service = services.find((item) => page === `service:${item.title}`);

  return (
    <div
      className="relative z-0 min-h-0 flex-1 overflow-auto bg-white pb-28"
      ref={canvasRef}
    >
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
      {page === "home" ? (
        <HomeBody followSlot={followSlot} hero={hero} services={services} />
      ) : null}
      {page === "services" ? (
        <ServicesBody followSlot={followSlot} services={services} />
      ) : null}
      {service ? <ServiceBody service={service} /> : null}
      {page === "contact" ? (
        <SimpleBody
          follow={followSlot === "contact"}
          lede={contact}
          title="Contact"
        />
      ) : null}
      {page === "privacy" ? (
        <SimpleBody
          lede="Unpublished website page. Assistant can open this page even when it is not in the top menu."
          title="Privacy"
        />
      ) : null}
      {page === "terms" ? (
        <SimpleBody
          lede="Unpublished website page. Assistant can open this page even when it is not in the top menu."
          title="Terms"
        />
      ) : null}
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

function HomeBody({
  followSlot,
  hero,
  services,
}: {
  followSlot: FollowSlot | null;
  hero: typeof siteHero;
  services: ServiceRow[];
}): ReactNode {
  return (
    <>
      <div
        className={cn(
          "bg-site-hero px-8 py-20 text-site-hero-fg",
          followSlot === "hero" ? followFlash : "",
        )}
      >
        <p className="text-xs tracking-[0.12em] uppercase">{hero.kicker}</p>
        <h1 className="mt-2 text-4xl font-semibold">{hero.headline}</h1>
        <p className="mt-4 max-w-lg text-sm opacity-80">{hero.lede}</p>
        <Button className="mt-6">Get a quote</Button>
      </div>
      <ServicesBody followSlot={null} services={services} />
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

function ServicesBody({
  followSlot,
  services,
}: {
  followSlot: FollowSlot | null;
  services: ServiceRow[];
}): ReactNode {
  return (
    <section
      className={cn("p-8", followSlot === "services" ? followFlash : "")}
    >
      <h2 className="text-lg font-semibold">Services</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-3">
        {services.map((item, index) => (
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

function ServiceBody({ service }: { service: ServiceRow }): ReactNode {
  const index = Math.max(
    0,
    siteServices.findIndex((item) => item.title === service.title),
  );
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

function SimpleBody({
  follow = false,
  lede,
  title,
}: {
  follow?: boolean;
  lede: string;
  title: string;
}): ReactNode {
  return (
    <section className={cn("p-8", follow ? followFlash : "")}>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-3 max-w-lg text-sm text-muted-foreground">{lede}</p>
    </section>
  );
}
