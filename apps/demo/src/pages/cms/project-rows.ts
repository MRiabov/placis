import { photo } from "@/lib/fixtures";

type DemoFlags = {
  dev?: string;
  shot?: string;
};

export type ListSearch = DemoFlags & {
  empty: string | undefined;
  archive: string | undefined;
  archived: string | undefined;
};

export type ProjectSearch = DemoFlags & {
  picker: string | undefined;
  diff: string | undefined;
};

function flagOn(value: unknown): boolean {
  return value === "1" || value === 1 || value === true || value === "true";
}

function demoFlags(from?: Record<string, unknown>): DemoFlags {
  const source = (from ??
    Object.fromEntries(
      new URLSearchParams(window.location.search).entries(),
    )) as { dev?: unknown; shot?: unknown };
  return {
    ...(flagOn(source.dev) ? { dev: "1" } : {}),
    ...(flagOn(source.shot) ? { shot: "1" } : {}),
  };
}

export function listSearch(
  extra: Partial<Pick<ListSearch, "empty" | "archive" | "archived">> = {},
  from?: Record<string, unknown>,
): ListSearch {
  return {
    empty: extra.empty,
    archive: extra.archive,
    archived: extra.archived,
    ...demoFlags(from),
  };
}

export function projectSearch(
  extra: Partial<Pick<ProjectSearch, "picker" | "diff">> = {},
  from?: Record<string, unknown>,
): ProjectSearch {
  return {
    picker: extra.picker,
    diff: extra.diff,
    ...demoFlags(from),
  };
}

export type ProjectRow = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  caption: string;
  archived: boolean;
};

export const projectRows: ProjectRow[] = [
  {
    id: "storm",
    title: "Storm repair, Malahide",
    description: "Replaced the rear slope after wind damage.",
    image: photo(0),
    caption: "Rear slope after the storm",
    archived: false,
  },
  {
    id: "reroof",
    title: "Full re-roof, Swords",
    description: "New slate, valleys, and ridge.",
    image: photo(1),
    caption: "Full re-roof on a semi",
    archived: false,
  },
  {
    id: "gutter",
    title: "Guttering, Howth",
    description: "Fascia, soffit, and gutter replacement.",
    image: null,
    caption: "",
    archived: false,
  },
  {
    id: "garage",
    title: "Garage conversion, Swords",
    description: "Converted the garage and made good the roof line.",
    image: photo(3),
    caption: "Finished elevation",
    archived: true,
  },
];

/** Ranked interview seed: cover first, then a no-cover extra so Archive
 *  can surface the next-ranked card. CMS list still uses `projectRows`. */
export const interviewProjectRows: ProjectRow[] = [
  ...projectRows.filter((row) => row.image && !row.archived),
  {
    id: "dormer",
    title: "Dormer, Portmarnock",
    description: "New dormer and slate make-good.",
    image: photo(2),
    caption: "Dormer from the garden",
    archived: false,
  },
  {
    id: "chimney",
    title: "Chimney rebuild, Sutton",
    description: "Rebuilt the stack and flashed the soakers.",
    image: photo(3),
    caption: "Rebuilt stack",
    archived: false,
  },
  ...projectRows.filter((row) => !row.image && !row.archived),
];

export const composedDescription =
  "Replaced the rear slope and flashing after wind damage. New slate on the valley. Completed before the next storm.";
