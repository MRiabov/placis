export const siteHero = {
  kicker: "Dublin roofing",
  headline: "Roofs that keep Irish weather out.",
  lede: "Repairs, re-roofs, and emergency call-outs across Dublin and North County.",
};

export const siteServices = [
  {
    title: "Roof repairs",
    blurb: "Slate, tile, and flat roof repairs without a full strip.",
  },
  {
    title: "New roofs",
    blurb: "Re-roofs with a workmanship guarantee on every job.",
  },
  {
    title: "Guttering",
    blurb: "Cleaning, replacement, and fascia upgrades.",
  },
] as const;

export const siteNeighbourQuotes = [
  "“On the roof the next morning after the storm. Clean site, fair price.” — Aoife K.",
  "“Replaced the back slope and left the garden better than they found it.” — Mark D.",
] as const;

export type SiteReview = {
  name: string;
  meta: string;
  when: string;
  quote: string;
  stars: string;
  photo: number;
};

export const siteReviews: SiteReview[] = [
  {
    name: "Aoife K.",
    meta: "Local Guide · 14 reviews",
    when: "3 months ago",
    quote:
      "On the roof the next morning after the storm. Clean site, fair price.",
    stars: "★★★★★",
    photo: 5,
  },
  {
    name: "Mark D.",
    meta: "8 reviews",
    when: "6 months ago",
    quote:
      "Replaced the back slope and left the garden better than they found it.",
    stars: "★★★★★",
    photo: 4,
  },
  {
    name: "Siobhan R.",
    meta: "Facebook",
    when: "9 months ago",
    quote:
      "They arrived on time, were polite, showed my husband the work they had completed.",
    stars: "★★★★☆",
    photo: 6,
  },
];
