# CMS design tokens

The CMS (sidebar + main area): `/cms` two-card chooser, website editor, Details,
Ads list, Leads. Not the contractor website look — that is [website styles](../../features/website/styles.md).
[Design decision record](design-decision-record.md). Editable look: [`apps/demo/`](../../../apps/demo/README.md)
(`src/styles/theme.css`). CMS wins when they disagree. Owner field controls,
buttons, combobox, labels, and the mock-only yellow strip live in the look app
([design decision](design-decision-record.md) 6).

Clone placis-web `globals.css` (light) + `marketingSite.ts`. Do not invent a
second palette. Do not restyle Ads creative surfaces from this file.

## Type

| Token | Value |
| --- | --- |
| `--site-font` | Satoshi, Helvetica Neue, Arial, sans-serif |
| Body tracking | `-0.01em` |
| Weights | `400` / `450` / `500` / `600` |

## Color

Named CSS variables in the mock. Hex is the light-theme value.

| Token | Value | Use |
| --- | --- | --- |
| `--background` | `#ffffff` | Canvas; resting fill on outline controls |
| `--foreground` | `#27272a` | Body copy (zinc-800) |
| `--primary` | `#13120a` | Ink: filled send, Publish, Apply |
| `--primary-foreground` | `#ffffff` | On ink |
| `--secondary` | `#f4f4f5` | Raised / unused wash (zinc-100). **Not** a resting button fill |
| `--secondary-foreground` | `#27272a` | On `--secondary` |
| `--muted` | `#f4f4f5` | Same wash as `--secondary` today |
| `--muted-foreground` | `#71717a` | Hints, captions (zinc-500) |
| `--cms-surface-sunken` | `#fafafa` | zinc-50: open Connect, hover on outline / flat controls |
| `--border` | `#e4e4e7` | Outline control stroke (zinc-200) |
| `--hairline` | `#e7e5e4` | Stone edge: prompt box, flat Connect / Paperclip / Voice |
| `--sidebar` | `#f7f7f7` | Nav rail |
| `--cms-surface-active` | `rgb(9 9 11 / 6%)` | Active nav row |
| `--ring` | `#a1a1aa` | Focus ring |
| `--prompt-shelf` | `rgb(250 250 250 / 80%)` | Prompt shelf (unused on `/cms` two cards) |
| `--prompt-icon-border` | `--hairline` | Flat prompt icon stroke |
| `--prompt-radius` | `1.75rem` | Prompt box (28px) |
| `--cms-error-surface` | `#fff1f0` | Error wash |
| `--cms-warning-surface` | `#fffbeb` | Warning wash; mock-only Dev strip |

Idle nav rows: zinc-600 (`#52525b`, `--cms-text-secondary`).
Prompt / accordion title strip uses `--cms-surface-sunken`.

## Radius and motion

| Token | Value | Use |
| --- | --- | --- |
| `--radius` / `--cms-radius-control` | `0.625rem` | Fields, outline buttons |
| `--cms-radius-pill` | `999px` | Connect, icon hits, Voice / send |
| `--cms-ease` | `cubic-bezier(0.2, 0, 0, 1)` | UI motion |
| `--cms-duration-fast` | `120ms` | Fast UI; hover-tap panel close uses 120ms |

## Control recipes

Fill comes from the tokens above. Do not paint `--secondary` on a control at
rest.

| Recipe | Rest | Hover / open | Stroke |
| --- | --- | --- | --- |
| **Ink** (send, Apply, Publish) | `--primary` | `#27272a` (`--cms-accent-hover`) | `rgb(0 0 0 / 10%)` |
| **Outline** (Change, Copy, Reject, `.button-secondary`) | `--background` | `--cms-surface-sunken` | `--border` |
| **Flat prompt** (Connect, Paperclip, Voice) | `--background` | `--cms-surface-sunken` only while open or `(hover: hover)` | `--hairline` |

Connect zinc-50 is the **open** fill (Google / Meta panel), not a stuck
`:hover`. Connect is not on `/cms`; it lives on Ads. The hidden prompt-box
control still hides when Google Ads and Meta are both connected
([design decision record](design-decision-record.md) 5).

`/cms` chooser cards clone the prompt-box look: `--hairline`,
`--prompt-radius`, and a readable lift of the prompt shade (`0 1px 2px / 6%`,
`0 10px 28px / 10%` — `--prompt-shadow` is too faint on this white canvas). Each
card has a destination logo (Sites globe, Ads megaphone) in a sunken well. The
two cards sit in one row on a wide screen and stack on a narrow screen.

## Not these

- Contractor website presets ([website styles](../../features/website/styles.md)) — Radix scales on the live site,
  not The CMS.
- `frontend-2` predecessor oklch `--secondary` and filled `bg-secondary` — out
  of scope until that port; this table wins.
- A second CMS breakpoint — keep **1100px** ([design decision record](design-decision-record.md) 4). Prompt
  Paperclip / Voice hide under **640px** (`sm`), not a new product breakpoint.
