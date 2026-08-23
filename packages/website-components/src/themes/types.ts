import type { PublicSiteTheme } from "../types";

export type PublicThemeColorTokens = {
  brand: string;
  brandMuted: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
};

export type PublicThemeTypographyTokens = {
  headingFamily: string;
  bodyFamily: string;
  labelTracking: string;
  headingWeight: number;
  bodyWeight: number;
};

export type PublicThemeSpacingTokens = {
  sectionBlock: string;
  containerInline: string;
  radius: string;
};

export type PublicThemeMotionTokens = {
  easing: string;
  revealDuration: string;
  hoverDuration: string;
};

export type PublicSiteThemePreset = {
  id: string;
  label: string;
  source?: string;
  cssClass: string;
  runtimeTheme: PublicSiteTheme;
  colors: PublicThemeColorTokens;
  typography: PublicThemeTypographyTokens;
  spacing: PublicThemeSpacingTokens;
  motion: PublicThemeMotionTokens;
  notes: string[];
};
