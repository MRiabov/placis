import { cn } from "@/lib/cn";

/** HTML `--cms-radius-panel` and hardcoded 12px: onboarding cards, reviews, combo. */
const panelClass = "rounded-panel border border-border bg-white";

/** Home destination buttons use the same raised card as the Placis-web
 * dashboard prompt: a visible outline plus a soft, deep dark-mode elevation. */
const chooserCardClass =
  "rounded-prompt border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.05)] dark:border-white/20 dark:bg-background dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_6px_20px_rgba(0,0,0,0.35)]";

/** HTML `.cms-notice`: 16px, hairline, prompt shadow. */
const noticeClass =
  "rounded-[16px] border border-hairline bg-white shadow-prompt";

/** HTML `.onb-card`: panel radius, 20px 24px padding, 10px gap. */
const onbCardClass = `${panelClass} grid gap-2.5 px-6 py-5`;

/** HTML `--cms-radius-card`. Ads pass `rounded-prompt border-hairline shadow-prompt`. */
export function card(
  ...extra: Array<string | false | null | undefined>
): string {
  const extras = extra.filter(Boolean).join(" ");
  const radius = /\brounded-/.test(extras) ? null : "rounded-lg";
  const border = /\bborder-(hairline|border)\b/.test(extras)
    ? "border"
    : "border border-border";
  return cn("bg-white", radius, border, ...extra);
}

export function panel(
  ...extra: Array<string | false | null | undefined>
): string {
  return cn(panelClass, ...extra);
}

export function chooserCard(
  ...extra: Array<string | false | null | undefined>
): string {
  return cn(chooserCardClass, ...extra);
}

export function noticeBox(
  ...extra: Array<string | false | null | undefined>
): string {
  return cn(noticeClass, ...extra);
}

export function onbCard(
  ...extra: Array<string | false | null | undefined>
): string {
  return cn(onbCardClass, ...extra);
}
