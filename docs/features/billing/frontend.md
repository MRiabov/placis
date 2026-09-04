# Billing frontend specification

Status: proposed frontend specification.

Related docs:

1. [Billing PRD](prd.md)
2. [Billing ADR](ADR.md)
3. [Look export](../../../apps/demo/README.md) (`/cms/billing`)

## Purpose

**Usage & billing** in `frontend-2`. The owner sees the current
subscription tier, subscription price, remaining usage credit, extra
usage credit, **one bar** of the current pool, **Cancel subscription**,
and pay-again after `canceled`. Reached from the account menu (user
icon / Clerk photo). Not a left-nav peer of Sites or Ads. Not public
Pricing (that is the Placis website).

Settings and Log out stay hidden. Overlay destinations stay Sites /
Profile children / Ads / Leads — no Usage & billing row there.

## Design mock

[`apps/demo/`](../../../apps/demo/README.md) `/cms/billing`. Dev strip
states: pool remaining, 20% left, out of usage credit, cancels at period
end, subscription not active. `?shot=1` hides the strip. Codex for the
look. Do not port auto-reload, usage-limit bars, or predecessor
dashboard Usage & billing copy. Don't say: build credits. Do not show
our cost. Money on screen is **EUR**.

Change plan to other tiers is deferred. Do not ship a three-card Plus /
Max / year grid on this screen in this spec. When the subscription is
not `active`, pay-again is Placis Pro plan / month Checkout from this
screen — not on placis.com.

## Fields

- Current subscription tier (Placis Pro plan). When the subscription is
  not active, say so here. Plus / Max / Enterprise plan are not
  self-serve Choose here.
- Subscription price (EUR from the cached Price) and billing interval
  (month).
- Remaining usage credit (their cost) as a large EUR figure.
- **One bar:** current pool (including carry-over), in a raised card
  with the remaining figure and extra usage credit. Filled = spent this
  period; filled segments colored Voice / Image / text edits. Unfilled
  track = remaining.
- Buy extra usage credit (Stripe Checkout from this screen, not from
  Pricing). Owner-chosen `amount_eur`.
- **Pay-again** — when the subscription is not `active`, **Choose** starts
  Placis Pro plan / month Checkout here (no access fee). Hosted Checkout URL
  from `POST /v1/billing/subscription/checkout`.
- **Cancel subscription** — quiet text control after a hairline, not
  the primary. Cancels at `current_period_end` (they keep Publish until
  then). While that is scheduled: **Cancels on {date}** and **Keep
  subscription** (ink). After the period ends, Cancel is gone;
  pay-again is how they resume. Do not send them to placis.com to
  cancel.

## Notification

The shared **notification**
([frontend conventions](../../general-architecture/frontend.md)), not
the Details OK / Revert pair.

- About 20% of the current pool left: warn. Primary: Usage & billing.
  Secondary: Dismiss. Billed work still runs.
- Empty: **you are out of usage credit**. Primary: Usage & billing (buy
  extra usage credit). Secondary: Dismiss. Billed composer and Voice
  stop.

## Routes

| Route | Purpose |
| --- | --- |
| (account menu) | Open Usage & billing. No left-nav path. |
| `/cms` … other destinations | Unchanged. |

Exact path for Usage & billing can be `/cms/usage-and-billing` when
`frontend-2` lands; the look export uses `/cms/billing`.
