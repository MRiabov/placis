import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { photo } from "@/lib/fixtures";
import { siteHero, siteNeighbourQuotes, siteServices } from "@/lib/site-copy";

export type SiteSection =
  | "top-menu"
  | "hero"
  | "services"
  | "reviews"
  | "form"
  | "footer";

type FakeSiteProps = {
  page: string;
  radius: string;
  density: string;
  selected: SiteSection | null;
  hidden: Partial<Record<SiteSection, boolean>>;
  pending: boolean;
  onSelect: (section: SiteSection) => void;
};

const radii: Record<string, string> = {
  none: "0px",
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
};

const space: Record<string, string> = {
  compact: "0.75rem",
  comfortable: "1.5rem",
  spacious: "2.25rem",
};

export function FakeSite({
  page,
  radius,
  density,
  selected,
  hidden,
  pending,
  onSelect,
}: FakeSiteProps): ReactNode {
  const titles = {
    home: siteHero.headline,
    services: "Roof repairs",
    contact: "Contact",
    privacy: "Privacy",
    terms: "Terms",
  };

  return (
    <div
      className="min-h-0 overflow-auto overscroll-contain bg-white font-[Georgia,'Times_New_Roman',serif] text-site-ink"
      data-fake-site
      style={{
        ["--public-radius" as string]: radii[radius] ?? "16px",
        ["--site-space" as string]: space[density] ?? "1.5rem",
      }}
    >
      <div className="min-h-full bg-white">
        <Block
          hidden={hidden["top-menu"] === true}
          onSelect={() => onSelect("top-menu")}
          selected={selected === "top-menu"}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm">
            <span className="font-medium">Bellfield Roofing</span>
            <span className="text-muted-foreground">
              <span>Home</span>
              <span> · </span>
              <span>Services</span>
              <span> · </span>
              <span>Contact</span>
            </span>
            <span>01 555 0199 · Contact</span>
          </div>
        </Block>
        <Block
          className="bg-site-hero px-8 py-16 text-site-hero-fg"
          hidden={hidden.hero === true}
          onSelect={() => onSelect("hero")}
          pending={pending}
          selected={selected === "hero"}
        >
          <p className="text-xs tracking-[0.12em] uppercase">
            {siteHero.kicker}
          </p>
          <h2 className="mt-2 text-3xl font-semibold">
            {page === "home" ? (
              <>
                {siteHero.headline}{" "}
                <span className="rounded-full border border-white/30 px-2 py-0.5 text-xs font-normal">
                  {"{{trade}}"}
                </span>
              </>
            ) : page in titles ? (
              titles[page as keyof typeof titles]
            ) : (
              titles.home
            )}
          </h2>
          <p className="mt-3 max-w-md text-sm opacity-80">{siteHero.lede}</p>
        </Block>
        <Block
          hidden={hidden.services === true}
          onSelect={() => onSelect("services")}
          selected={selected === "services"}
        >
          <div className="grid gap-6 p-8 sm:grid-cols-3">
            {siteServices.map((item, index) => (
              <div key={item.title}>
                <div
                  className="h-24 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${photo(index)})`,
                    borderRadius: radii[radius] ?? "16px",
                  }}
                />
                <h3 className="mt-2 text-sm font-medium">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.blurb}</p>
              </div>
            ))}
          </div>
        </Block>
        <Block
          hidden={hidden.reviews === true}
          onSelect={() => onSelect("reviews")}
          selected={selected === "reviews"}
        >
          <div className="p-8">
            <h3 className="text-sm font-medium">What neighbours wrote</h3>
            {siteNeighbourQuotes.map((quote) => (
              <blockquote
                className="mt-3 text-sm text-muted-foreground"
                key={quote}
              >
                {quote}
              </blockquote>
            ))}
          </div>
        </Block>
        <Block
          hidden={hidden.form === true}
          onSelect={() => onSelect("form")}
          selected={selected === "form"}
        >
          <div className="p-8">
            <h3 className="text-sm font-medium">Request a call back</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Name, marketing phone, and a privacy notice on this website form.
            </p>
          </div>
        </Block>
        <Block
          hidden={hidden.footer === true}
          onSelect={() => onSelect("footer")}
          selected={selected === "footer"}
        >
          <div className="flex flex-wrap justify-between gap-2 border-t border-border px-8 py-4 text-xs text-muted-foreground">
            <span>
              Bellfield Roofing · Dublin
              <br />
              01 555 0199 · hello@acme.ie
            </span>
            <span>Privacy · Terms</span>
          </div>
        </Block>
      </div>
    </div>
  );
}

function Block({
  selected,
  hidden,
  pending,
  onSelect,
  children,
  className,
}: {
  selected: boolean;
  hidden?: boolean;
  pending?: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
}): ReactNode {
  return (
    <button
      className={cn(
        "block w-full text-left",
        selected ? "ring-2 ring-primary ring-inset" : "",
        hidden ? "opacity-40" : "",
        pending ? "outline outline-dashed outline-amber-600" : "",
        className,
      )}
      onClick={onSelect}
      type="button"
    >
      {hidden ? (
        <span className="float-right m-2 rounded bg-black/10 px-1 text-[10px]">
          Hidden
        </span>
      ) : null}
      {children}
    </button>
  );
}
