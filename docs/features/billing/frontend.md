# Billing frontend specification

Status: proposed frontend specification.

Related docs:

1. [Billing PRD](prd.md)
2. [Billing ADR](ADR.md)
3. [Look export](../../../demo/README.md) (`/cms/billing`)

## Purpose

**Usage & billing** in `frontend-2`. The owner sees the current subscription
tier, subscription price, remaining usage credit, extra usage credit, **one
bar** of the current pool, **Change plan**, and **Cancel subscription**.
Reached from the account menu (user icon / Clerk photo). Not a left-nav peer
of Sites or Ads. Not public Pricing (that is the Placis website).

Settings and Log out stay hidden. Overlay destinations stay Sites / Profile
children / Ads — no Usage & billing row there.

## Design mock

[`demo/`](../../../demo/README.md) `/cms/billing`. Dev strip states: pool remaining, 20% left, out of
usage credit, cancels at period end, subscription not active. `?shot=1` hides
the strip. Codex for the look. Do not port auto-reload, usage-limit bars, or
predecessor dashboard Usage & billing copy. Change plan uses the same
three-card + Enterprise plan row as placis.com `/pricing/` (placis-web pricing
grid: blurb + feature list). Included usage credit is USD. Don't say: build
credits. Do not show our cost. HTML archive: [cms.html](../../design/cms.html) `?scene=billing`.

## Fields

- Current subscription tier (Placis Pro plan / Placis Pro Plus plan / Placis
  Pro Max plan; Enterprise plan is contact sales). When the subscription is
  not active, say so here.
- Subscription price and billing interval.
- Remaining usage credit (their cost) as a large USD figure.
- **One bar:** current pool (including carry-over), in a raised card with the
  remaining figure and extra usage credit. Filled = spent this period; filled
  segments colored Voice / Image / text edits. Unfilled track = remaining.
- Buy extra usage credit (Stripe Checkout from this screen, not from Pricing).
- **Change plan** — the Pricing card grid on this screen: month / year
  (−20% yearly, `/ mo, billed yearly`) on the same row as the heading, three
  self-serve cards (name, price, blurb, feature list with included usage credit
  in USD), then an Enterprise plan row. Current card is marked; its control is
  **Current** (disabled). Other cards say **Choose** (the card title is the
  plan name). Choosing another self-serve tier starts subscription checkout
  here — not on placis.com. When the subscription is not `active`, the same
  grid is how they pay again so they can Publish (**Choose** is the primary
  control then).
- **Cancel subscription** — quiet text control after a hairline, not the
  primary. Cancels at `current_period_end` (they keep Publish until then).
  While that is scheduled: **Cancels on {date}** and **Keep subscription**
  (ink). After the period ends, Cancel is gone; Change plan is pay-again. Do
  not send them to placis.com to cancel.

## Notification

The shared **notification** ([frontend conventions](../../general-architecture/frontend.md)), not the Details OK /
Revert pair.

- About 20% of the current pool left: warn. Primary: Usage & billing.
  Secondary: Dismiss. Billed work still runs.
- Empty: **you are out of usage credit**. Primary: Usage & billing (buy extra
  usage credit). Secondary: Dismiss. Billed composer and Voice stop.

## Routes

| Route | Purpose |
| --- | --- |
| (account menu) | Open Usage & billing. No left-nav path. |
| `/cms` … other destinations | Unchanged. |

Exact path for Usage & billing can be `/cms/usage-and-billing` when
`frontend-2` lands; the look export uses `/cms/billing`.
