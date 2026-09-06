import { amber, green, slate } from "@radix-ui/colors";
import type { WebsiteThemePreset } from "../types";

const greenGoldColors = {
  accent: amber.amber9,
  background: "#ffffff",
  brand: green.green12,
  brandMuted: green.green11,
  border: slate.slate6,
  mutedText: slate.slate11,
  surface: slate.slate2,
  text: slate.slate12,
};

export const greenGoldThemePreset = {
  id: "theme.green_gold",
  label: "Green & Gold",
  source: "https://www.pcl.com/us/en multi-page reference decomposition",
  cssClass: "public-theme-green-gold",
  websiteTheme: {
    preset: "green_gold",
    primary: greenGoldColors.brand,
    neutral: "slate",
    accent: greenGoldColors.accent,
    background: greenGoldColors.background,
    text: greenGoldColors.text,
    muted: greenGoldColors.mutedText,
    border: greenGoldColors.border,
    radius: "0px",
    density: "spacious",
  },
  colors: {
    brand: greenGoldColors.brand,
    brandMuted: greenGoldColors.brandMuted,
    accent: greenGoldColors.accent,
    background: greenGoldColors.background,
    surface: greenGoldColors.surface,
    text: greenGoldColors.text,
    mutedText: greenGoldColors.mutedText,
    border: greenGoldColors.border,
  },
  typography: {
    headingFamily: '"Barlow Condensed", "Arial Narrow", system-ui, sans-serif',
    bodyFamily: '"Barlow", Inter, system-ui, sans-serif',
    labelTracking: "0",
    headingWeight: 700,
    bodyWeight: 400,
  },
  spacing: {
    sectionBlock: "92px",
    containerInline: "28px",
    radius: "0px",
  },
  motion: {
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    revealDuration: "500ms",
    hoverDuration: "160ms",
  },
  notes: [
    "Reference preset inspired by a green, high-visibility yellow, white, black, and light-gray visual system.",
    "Production tokens combine source colors into Radix-backed semantic roles instead of copying arbitrary source hex values.",
    "Square edges, condensed Barlow headings, uppercase labels, full-bleed imagery, and hard accent rules belong to this style preset rather than individual website component logic.",
    "Use when the page structure has enough reviews, projects, and content volume to support a dense layout.",
    "Do not pick solely from contractor size or service category.",
  ],
} satisfies WebsiteThemePreset;
