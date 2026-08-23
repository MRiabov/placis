import { red, slate } from "@radix-ui/colors";
import type { PublicSiteThemePreset } from "../types";

const redCharcoalColors = {
  accent: red.red9,
  accentText: red.red11,
  background: "#ffffff",
  brand: slate.slate12,
  brandMuted: slate.slate11,
  border: slate.slate6,
  mutedText: slate.slate11,
  surface: slate.slate2,
  text: slate.slate12,
};

export const redCharcoalThemePreset = {
  id: "theme.red_charcoal",
  label: "Red & Charcoal",
  source: "https://roofshield.ie/ (Astra + Elementor post-26.css)",
  cssClass: "public-theme-red-charcoal",
  runtimeTheme: {
    preset: "red_charcoal",
    primary: redCharcoalColors.brand,
    neutral: "slate",
    accent: redCharcoalColors.accent,
    background: redCharcoalColors.background,
    text: redCharcoalColors.text,
    muted: redCharcoalColors.mutedText,
    border: redCharcoalColors.border,
    radius: "4px",
    density: "comfortable",
  },
  colors: {
    brand: redCharcoalColors.brand,
    brandMuted: redCharcoalColors.brandMuted,
    accent: redCharcoalColors.accent,
    background: redCharcoalColors.background,
    surface: redCharcoalColors.surface,
    text: redCharcoalColors.text,
    mutedText: redCharcoalColors.mutedText,
    border: redCharcoalColors.border,
  },
  typography: {
    headingFamily: '"Archivo", system-ui, sans-serif',
    bodyFamily: '"Source Sans 3", system-ui, sans-serif',
    labelTracking: "0.18em",
    headingWeight: 600,
    bodyWeight: 400,
  },
  spacing: {
    sectionBlock: "56px",
    containerInline: "24px",
    radius: "4px",
  },
  motion: {
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    revealDuration: "400ms",
    hoverDuration: "200ms",
  },
  notes: [
    "The improved reference uses Radix Colors without introducing a second dominant hue: slate12/slate11 for neutral structure, red9 for solid accents, red11 for red text on white, and slate6 for borders.",
    "The palette keeps a red/black/white identity while reducing the harsh contrast in the original Elementor treatment.",
    "Typography now uses Archivo headings with Source Sans 3 body copy so the improved reference avoids the source site's default Roboto-heavy Elementor feel.",
    "Pill call-to-action buttons and dark neutral proof/contact bands remain source-adjacent treatments, while supplier proof is rendered as a static material row instead of a hero-adjacent marquee.",
    "Use as a reference fixture theme, not as the default for every business website.",
  ],
} satisfies PublicSiteThemePreset;
