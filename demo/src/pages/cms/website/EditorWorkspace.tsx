import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { ContentPanel } from "@/pages/cms/website/ContentPanel";
import type { SiteSection } from "@/pages/cms/website/FakeSite";
import { Button } from "@/ui/Button";
import { card } from "@/ui/card";
import { Field, TextArea, TextInput } from "@/ui/Field";

export type EditorRail = "pages" | "seo" | "styles" | "versions" | "content";

export type EditorPage = {
  id: string;
  label: string;
  path: string;
  title: string;
};

type EditorWorkspaceProps = {
  rail: EditorRail;
  open: boolean;
  page: string;
  pages: EditorPage[];
  current: EditorPage;
  section: SiteSection | null;
  hidden: Partial<Record<SiteSection, boolean>>;
  radius: string;
  density: string;
  onRail: (rail: Exclude<EditorRail, "content">) => void;
  onCollapse: () => void;
  onPage: (id: string) => void;
  onToggleHidden: () => void;
  onRadius: (value: string) => void;
  onDensity: (value: string) => void;
};

const rails: Array<{
  id: Exclude<EditorRail, "content">;
  label: string;
  end?: boolean;
  icon: ReactNode;
}> = [
  {
    id: "pages",
    label: "Website pages",
    icon: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </>
    ),
  },
  {
    id: "seo",
    label: "SEO",
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3-3" />
      </>
    ),
  },
  {
    id: "styles",
    label: "Website styles",
    icon: (
      <>
        <rect height="8" rx="1" width="8" x="3" y="3" />
        <rect height="8" rx="1" width="8" x="13" y="3" />
        <rect height="8" rx="1" width="8" x="8" y="13" />
      </>
    ),
  },
  {
    id: "versions",
    label: "Website versions",
    end: true,
    icon: (
      <>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
];

const radii = ["none", "xs", "sm", "md", "lg"] as const;
const densities = ["compact", "comfortable", "spacious"] as const;
const radiusPx: Record<string, string> = {
  none: "0px",
  xs: "2px",
  sm: "4px",
  md: "8px",
  lg: "12px",
};
const densityGap: Record<string, string> = {
  compact: "2px",
  comfortable: "5px",
  spacious: "9px",
};

export function EditorWorkspace({
  rail,
  open,
  page,
  pages,
  current,
  section,
  hidden,
  radius,
  density,
  onRail,
  onCollapse,
  onPage,
  onToggleHidden,
  onRadius,
  onDensity,
}: EditorWorkspaceProps): ReactNode {
  const sitePages = pages.filter(
    (item) => item.id !== "privacy" && item.id !== "terms",
  );
  const legalPages = pages.filter(
    (item) => item.id === "privacy" || item.id === "terms",
  );
  const title =
    rail === "content"
      ? "Content"
      : (rails.find((item) => item.id === rail)?.label ?? "Website pages");

  return (
    <aside
      aria-label="Workspace"
      className={cn(
        "z-10 grid min-h-0 overflow-hidden bg-sidebar",
        "min-[1101px]:grid-rows-1 min-[1101px]:border-r min-[1101px]:border-border",
        open
          ? "min-[1101px]:w-[300px] min-[1101px]:grid-cols-[60px_minmax(0,1fr)]"
          : "min-[1101px]:w-[60px] min-[1101px]:grid-cols-[60px]",
        "max-[1100px]:col-start-1 max-[1100px]:row-start-2 max-[1100px]:w-full max-[1100px]:grid-cols-1 max-[1100px]:border-t max-[1100px]:border-border",
        open
          ? "max-[1100px]:max-h-[45vh] max-[1100px]:grid-rows-[minmax(0,1fr)_auto]"
          : "max-[1100px]:grid-rows-[auto]",
      )}
    >
      <div
        className={cn(
          "flex min-h-0 gap-1.5 bg-secondary",
          "min-[1101px]:h-full min-[1101px]:flex-col min-[1101px]:self-stretch min-[1101px]:border-r min-[1101px]:border-border min-[1101px]:px-[7px] min-[1101px]:py-3",
          "max-[1100px]:order-2 max-[1100px]:flex-row max-[1100px]:px-2 max-[1100px]:pt-1.5 max-[1100px]:pb-[calc(6px+env(safe-area-inset-bottom))]",
        )}
      >
        {rails.map((item) => (
          <button
            className={cn(
              "flex h-[54px] w-full flex-col items-center justify-center gap-[3px] rounded-lg py-1 text-muted-foreground",
              "max-[1100px]:h-[52px] max-[1100px]:min-w-0 max-[1100px]:flex-1",
              item.end &&
                "min-[1101px]:mt-auto max-[1100px]:ml-auto max-[1100px]:w-auto max-[1100px]:min-w-[4.5rem] max-[1100px]:flex-none",
              rail === item.id && "bg-black/5 text-foreground",
            )}
            key={item.id}
            onClick={() => onRail(item.id)}
            title={item.label}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-[18px] fill-none stroke-current stroke-[1.6]"
              viewBox="0 0 24 24"
            >
              {item.icon}
            </svg>
            <span className="block w-full text-center text-[9px] leading-[1.15] font-normal tracking-wide uppercase">
              {item.label}
            </span>
          </button>
        ))}
      </div>
      {open ? (
        <div className="min-h-0 min-w-0 overflow-auto p-3 max-[1100px]:order-1">
          <div
            className={cn(
              "relative mb-2.5 flex items-center gap-2 text-[13px] font-semibold",
              "max-[1100px]:sticky max-[1100px]:top-0 max-[1100px]:z-[1] max-[1100px]:mb-1.5 max-[1100px]:min-h-9 max-[1100px]:gap-1.5 max-[1100px]:bg-sidebar",
            )}
          >
            <button
              aria-label={`Hide ${title}`}
              className="absolute inset-0 z-[1] hidden items-center rounded-[8px] px-2 text-muted-foreground hover:bg-black/5 hover:text-foreground max-[1100px]:flex"
              onClick={onCollapse}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="size-[15px] fill-none stroke-current stroke-[1.6]"
                viewBox="0 0 24 24"
              >
                <path d="m7 13 5 5 5-5" />
                <path d="m7 6 5 5 5-5" />
              </svg>
            </button>
            <span className="relative z-[1] min-w-0 flex-1 pointer-events-none max-[1100px]:pl-7">
              {title}
            </span>
            {rail === "pages" ? (
              <button
                aria-label="Add a website page"
                className="relative z-[2] grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-black/5 hover:text-foreground"
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="size-4 fill-none stroke-current stroke-[1.6]"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            ) : null}
          </div>
          {rail === "pages" ? (
            <>
              <div className="grid gap-0.5">
                {sitePages.map((item) => (
                  <PageRow
                    key={item.id}
                    label={item.label}
                    onClick={() => onPage(item.id)}
                    path={item.path}
                    selected={page === item.id}
                  />
                ))}
              </div>
              <p className="mt-3.5 mb-1 text-[13px] font-normal text-muted-foreground">
                Legal
              </p>
              <div className="grid gap-0.5">
                {legalPages.map((item) => (
                  <PageRow
                    key={item.id}
                    label={item.label}
                    onClick={() => onPage(item.id)}
                    path={item.path}
                    selected={page === item.id}
                  />
                ))}
              </div>
            </>
          ) : null}
          {rail === "seo" ? (
            <div className="grid gap-3">
              <Field label="Website page title">
                <TextInput defaultValue={current.title} key={current.id} />
              </Field>
              <Field label="Website page path">
                <TextInput
                  defaultValue={current.path}
                  key={`${current.id}-path`}
                />
              </Field>
              <Field label="Description">
                <TextArea defaultValue="Dublin roofing repairs, re-roofs, and guttering." />
              </Field>
            </div>
          ) : null}
          {rail === "styles" ? (
            <StylesPanel
              density={density}
              onDensity={onDensity}
              onRadius={onRadius}
              radius={radius}
            />
          ) : null}
          {rail === "versions" ? <VersionsPanel /> : null}
          {rail === "content" && section ? (
            <ContentPanel
              hidden={Boolean(hidden[section])}
              onToggleHidden={onToggleHidden}
              section={section}
            />
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}

function PageRow({
  label,
  path,
  selected,
  onClick,
}: {
  label: string;
  path: string;
  selected: boolean;
  onClick: () => void;
}): ReactNode {
  return (
    <button
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[13px]",
        selected ? "bg-black/5" : "hover:bg-black/5",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
      <small className="text-[11px] text-muted-foreground">{path}</small>
    </button>
  );
}

function StylesPanel({
  radius,
  density,
  onRadius,
  onDensity,
}: {
  radius: string;
  density: string;
  onRadius: (value: string) => void;
  onDensity: (value: string) => void;
}): ReactNode {
  return (
    <div className="grid gap-2">
      <div
        className={card("mb-2 flex items-center justify-between gap-2 p-2.5")}
      >
        <div>
          <strong className="text-[13px]">Navy &amp; Cream</strong>
          <div className="mt-1.5 flex items-center gap-1">
            <span className="size-3 rounded-full border border-black/20 bg-[#1f2933]" />
            <span className="size-3 rounded-full border border-black/20 bg-[#f5f1ea]" />
            <span className="size-3 rounded-full border border-black/20 bg-[#c4a574]" />
          </div>
        </div>
        <Button disabled variant="outline">
          Applied
        </Button>
      </div>
      <div
        className={card("mb-2 flex items-center justify-between gap-2 p-2.5")}
      >
        <div>
          <strong className="text-[13px]">Timbermill Classic</strong>
          <div className="mt-1.5 flex items-center gap-1">
            <span className="size-3 rounded-full border border-black/20 bg-[#3f2e1f]" />
            <span className="size-3 rounded-full border border-black/20 bg-[#efe6d6]" />
            <span className="size-3 rounded-full border border-black/20 bg-[#b45309]" />
          </div>
        </div>
        <Button variant="outline">Apply</Button>
      </div>
      <p className="mt-3 text-[13px] tracking-tight text-zinc-600">
        Bounded overrides
      </p>
      <Field label="Primary">
        <input
          aria-label="Primary"
          className="h-11 w-full cursor-pointer rounded-[10px] border border-border bg-transparent p-[3px]"
          defaultValue="#1f2933"
          type="color"
        />
      </Field>
      <Field label="Neutral">
        <input
          aria-label="Neutral"
          className="h-11 w-full cursor-pointer rounded-[10px] border border-border bg-transparent p-[3px]"
          defaultValue="#f5f1ea"
          type="color"
        />
      </Field>
      <Field label="Accent">
        <input
          aria-label="Accent"
          className="h-11 w-full cursor-pointer rounded-[10px] border border-border bg-transparent p-[3px]"
          defaultValue="#c4a574"
          type="color"
        />
      </Field>
      <p className="text-[13px] tracking-tight text-zinc-600">Radius</p>
      <div className="grid grid-cols-5 gap-1">
        {radii.map((item) => (
          <button
            aria-pressed={radius === item}
            className={cn(
              "grid min-h-11 justify-items-center gap-1 rounded-lg px-0.5 py-1 text-[11px] text-zinc-600",
              radius === item
                ? "bg-black/5 text-foreground"
                : "hover:bg-black/5",
            )}
            key={item}
            onClick={() => onRadius(item)}
            type="button"
          >
            <span
              aria-hidden="true"
              className="size-[18px] border-t-[1.5px] border-l-[1.5px] border-current"
              style={{ borderTopLeftRadius: radiusPx[item] }}
            />
            {item}
          </button>
        ))}
      </div>
      <p className="text-[13px] tracking-tight text-zinc-600">Density</p>
      <div className="grid grid-cols-3 gap-1">
        {densities.map((item) => (
          <button
            aria-pressed={density === item}
            className={cn(
              "grid min-h-11 justify-items-center gap-1 rounded-lg px-0.5 py-1 text-[11px] capitalize text-zinc-600",
              density === item
                ? "bg-black/5 text-foreground"
                : "hover:bg-black/5",
            )}
            key={item}
            onClick={() => onDensity(item)}
            type="button"
          >
            <span
              aria-hidden="true"
              className="flex h-3.5 items-stretch"
              style={{ gap: densityGap[item] }}
            >
              <span className="w-1 rounded-px bg-current" />
              <span className="w-1 rounded-px bg-current" />
              <span className="w-1 rounded-px bg-current" />
            </span>
            {item}
          </button>
        ))}
      </div>
      <p className="mt-2.5 text-[13px] tracking-tight text-zinc-600">Logo</p>
      <div className="size-[72px] rounded-[10px] bg-[#d4d4d8]" />
    </div>
  );
}

function VersionsPanel(): ReactNode {
  return (
    <div>
      <div className={card("mb-2 p-2.5")}>
        <strong className="block text-[13px]">Website version 3</strong>
        <span className="text-[11px] text-muted-foreground">
          Live website · 12 Aug 2026, 09:14
        </span>
        <Button className="mt-2" variant="outline">
          Preview
        </Button>
      </div>
      <div className={card("mb-2 p-2.5")}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <strong className="block text-[13px]">Website version 2</strong>
            <span className="text-[11px] text-muted-foreground">
              12 Aug 2026, 08:02
            </span>
          </div>
          <button
            aria-label="Website rollback"
            className="grid size-7 place-items-center text-muted-foreground"
            title="Website rollback"
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-4 fill-none stroke-current stroke-[1.6]"
              viewBox="0 0 24 24"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
      </div>
      <div className={card("mb-2 p-2.5")}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <strong className="block text-[13px]">Website version 1</strong>
            <span className="text-[11px] text-muted-foreground">
              11 Aug 2026, 16:40
            </span>
          </div>
          <button
            aria-label="Website rollback"
            className="grid size-7 place-items-center text-muted-foreground"
            title="Website rollback"
            type="button"
          >
            <svg
              aria-hidden="true"
              className="size-4 fill-none stroke-current stroke-[1.6]"
              viewBox="0 0 24 24"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
      </div>
      <div className={card("mb-2 p-2.5")}>
        <strong className="block text-[13px]">Assistant</strong>
        <span className="text-[11px] text-muted-foreground">
          Updated image on Hero · 12 Aug 2026, 08:40
        </span>
      </div>
    </div>
  );
}
