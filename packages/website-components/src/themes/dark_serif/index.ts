import { amber, sand, slate } from "@radix-ui/colors";
import type { WebsiteThemePreset } from "../types";

const darkSerifColors = {
  accent: amber.amber10,
  accentText: amber.amber11,
  background: "#ffffff",
  brand: slate.slate12,
  brandMuted: sand.sand11,
  border: sand.sand6,
  mutedText: sand.sand11,
  surface: sand.sand2,
  text: slate.slate12,
};

export const darkSerifThemePreset = {
  id: "theme.dark_serif",
  label: "Dark Serif",
  source: "https://www.bigoaksconstruction.com/ (Squarespace template 7)",
  cssClass: "public-theme-dark-serif",
  websiteTheme: {
    preset: "dark_serif",
    primary: darkSerifColors.brand,
    neutral: "sand",
    accent: darkSerifColors.accent,
    background: darkSerifColors.background,
    text: darkSerifColors.text,
    muted: darkSerifColors.mutedText,
    border: darkSerifColors.border,
    radius: "0px",
    density: "comfortable",
  },
  colors: {
    brand: darkSerifColors.brand,
    brandMuted: darkSerifColors.brandMuted,
    accent: darkSerifColors.accent,
    background: darkSerifColors.background,
    surface: darkSerifColors.surface,
    text: darkSerifColors.text,
    mutedText: darkSerifColors.mutedText,
    border: darkSerifColors.border,
  },
  typography: {
    headingFamily: 'Georgia, "Times New Roman", serif',
    bodyFamily: '"Source Sans 3", Arial, sans-serif',
    labelTracking: "0.08em",
    headingWeight: 400,
    bodyWeight: 400,
  },
  spacing: {
    sectionBlock: "68px",
    containerInline: "32px",
    radius: "0px",
  },
  motion: {
    easing: "cubic-bezier(0.2, 0, 0, 1)",
    revealDuration: "420ms",
    hoverDuration: "180ms",
  },
  notes: [
    "The source uses a minimal Squarespace layout with a dark image banner, serif headings, white content canvas, ruled service labels, and very square controls.",
    "The preset normalizes the source's deep navy/black and warm construction accent into Radix slate, sand, and amber roles rather than creating a one-off hex palette.",
    "Use square buttons, thin rules, generous whitespace, and restrained typography. Avoid marketing-card density; the reference is intentionally plain and editorial.",
    "The Projects route is gallery-aware even though the current source page contains mostly spacer/rule structure; project imagery should be owner-selected before publication.",
  ],
} satisfies WebsiteThemePreset;
