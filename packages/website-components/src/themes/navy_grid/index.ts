import { blue, crimson, slate } from "@radix-ui/colors";
import type { PublicSiteThemePreset } from "../types";

const navyGridColors = {
  accent: crimson.crimson9,
  background: "#f6f7f9",
  border: blue.blue5,
  brand: blue.blue12,
  brandMuted: blue.blue11,
  mutedText: slate.slate11,
  surface: blue.blue2,
  text: blue.blue12,
};

export const navyGridThemePreset = {
  id: "theme.navy_grid",
  label: "Navy Grid",
  source: "https://suffolk.com/ home reference captured 2026-07-02",
  cssClass: "public-theme-navy-grid",
  runtimeTheme: {
    preset: "navy_grid",
    primary: navyGridColors.brand,
    neutral: "blue",
    accent: navyGridColors.accent,
    background: navyGridColors.background,
    text: navyGridColors.text,
    muted: navyGridColors.mutedText,
    border: navyGridColors.border,
    radius: "4px",
    density: "spacious",
  },
  colors: {
    brand: navyGridColors.brand,
    brandMuted: navyGridColors.brandMuted,
    accent: navyGridColors.accent,
    background: navyGridColors.background,
    surface: navyGridColors.surface,
    text: navyGridColors.text,
    mutedText: navyGridColors.mutedText,
    border: navyGridColors.border,
  },
  typography: {
    headingFamily: '"FavoritPro", "Helvetica Neue", Arial, sans-serif',
    bodyFamily: '"FavoritPro", "Helvetica Neue", Arial, sans-serif',
    labelTracking: "0.06em",
    headingWeight: 300,
    bodyWeight: 350,
  },
  spacing: {
    sectionBlock: "96px",
    containerInline: "32px",
    radius: "4px",
  },
  motion: {
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    revealDuration: "520ms",
    hoverDuration: "180ms",
  },
  notes: [
    "Radix blue12/blue11 carry the dark navy structure while crimson9 maps the red square accent.",
    "The source uses a proprietary display face; this preset keeps a safe FavoritPro/Helvetica/Arial stack and mirrors the source weights, tight leading, and neutral tracking without bundling those font files.",
    "Scroll-stop storytelling is approximated through full-viewport snap panels and sticky-style composition in CSS.",
    "Use this as a decomposition fixture for editorial panel-based pages, not as a default style.",
  ],
} satisfies PublicSiteThemePreset;
