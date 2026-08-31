# Billing PRD

Status: proposed product direction and implementation input.

Related docs:

1. [Billing ADR](ADR.md)
2. [Billing architecture](architecture.md)
3. [Billing frontend](frontend.md)
4. [Website activation](../onboarding/pipeline/09-website-activation.md)
5. [Placis website](../placis-website/README.md)

## Problem

After website activation the contractor pays a subscription price and spends
usage credit on billed work (assistant text, image generate/cleanup, ads
generate, Voice). They need to see remaining usage credit, buy extra usage
credit when the pool is low, and pick a subscription tier on public Pricing.
Today that product is unspecified: the application has a stub Usage row, and
the Placis website has no Pricing.

## Goals

1. Show **Pricing** on the Placis website: Placis Pro plan, Placis Pro Plus
   plan, Placis Pro Max plan, and Enterprise plan (contact sales). Choose goes
   to `app.placis.com`. No checkout on `placis.com`.
2. After website activation, the owner has a subscription tier. The
   subscription price includes monthly usage credit. Unused usage credit
   carries over to the next month (the new included amount is added; remaining
   is not zeroed).
3. Let the owner buy **extra usage credit** into the same pool. No auto-reload.
4. **Usage & billing** shows remaining usage credit and **one bar**: the
   current pool (including carry-over); filled is spent this period (their
   cost), colored Voice / Image / text edits; unfilled is remaining. Not our
   cost. No pie. No line items. On the same screen they **Change plan**
   (self-serve subscription tier, or Enterprise plan contact sales) and
   **Cancel subscription** (takes effect at period end).
5. Warn when about 20% of the current pool remains. When the pool is empty,
   billed work stops: **you are out of usage credit**, with a path to buy extra
   usage credit. If they stop paying the subscription price, the website is
   unpublished and they cannot Publish until the subscription is active again.

## Non-Goals

1. Do not move website-activation Stripe out of 08 in this slice.
2. Do not commit to Clerk Billing.
3. Do not put checkout on the Placis website.
4. Do not bill onboarding or the onboarding guide.
5. Do not show our cost. Do not port predecessor dashboard Usage & billing copy,
   Codex 5-hour / weekly caps, or auto-reload.

## Provisional catalogue

Amounts are provisional (from placis-web; the rewrite may change them). Display
currency is **USD**.

| Subscription tier | Monthly subscription price | Yearly (per month, billed yearly) | Included usage credit / month |
| --- | --- | --- | --- |
| Placis Pro plan | $599 | $479 | $100 |
| Placis Pro Plus plan | $799 | $639 | $400 |
| Placis Pro Max plan | $1,099 | $879 | $1,500 |
| Enterprise plan | Contact sales | Contact sales | Contact sales |

Yearly is about 20% off. Pricing cards use a blurb and a feature list (same
card layout as the placis-web pricing grid). Included usage credit is USD.
Don't say: build credits.

Website activation remains a one-time pay in 08. 08’s “~50 EUR / month” is
superseded for the monthly fee.

## User stories

1. As a contractor, I see Pricing on placis.com so I know the subscription
   tiers before I start.
2. As an owner, I open Usage & billing from the account menu and see remaining
   usage credit and how this period’s spend splits across Voice, Image, and
   text edits.
3. As an owner, unused usage credit is still there next month, plus the new
   included amount.
4. As an owner, when I am running out I am warned; when I am out, billed work
   stops until I buy extra usage credit.
5. As an owner, I change subscription tier or cancel from Usage & billing. I
   do not go to placis.com for that.
6. As an owner, if I stop paying the subscription price, the website is
   unpublished and I cannot Publish until I pay again.

## Acceptance

1. Pricing is on the Placis website at `/pricing/`, linked from the top bar
   and footer. Self-serve Choose goes to `app.placis.com`. Enterprise plan is
   contact sales.
2. Usage & billing is not a left-nav peer of Sites / Ads. It is on the account
   menu. Settings and Log out stay hidden.
3. The spend bar is one bar for the current pool. Filled segments are Voice /
   Image / text edits. Nested image or ads work during Voice is Image or text
   edits, not Voice.
4. 20% remaining and empty use the shared notification (not Details OK /
   Revert). Empty copy: **you are out of usage credit**, with a link to Usage
   & billing.
5. Unused usage credit carries over. Extra usage credit is the same pool.
6. If they stop paying, the live website is unpublished. Publish and live
   website rollback fail until the subscription is `active` again (**402**
   `subscription_canceled`, not `usage_credit_exhausted`). Usage & billing is
   the path to pay again. They can still edit the unpublished website.
7. Change plan and Cancel subscription are on Usage & billing. Cancel is at
   period end until then they can still Publish. Keep subscription undoes a
   scheduled cancel. After the period ends, Change plan is how they pay
   again. Enterprise plan is contact sales, not a self-serve Choose.
