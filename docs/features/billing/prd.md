# Billing PRD

Status: proposed product direction and implementation input.

Related docs:

1. [Billing ADR](ADR.md)
2. [Billing architecture](architecture.md)
3. [Billing frontend](frontend.md)
4. [Website activation](../onboarding/pipeline/09-website-activation.md)
5. [Placis website](../placis-website/README.md)

## Problem

After website activation the contractor pays a subscription price and
spends usage credit on billed work (assistant text, image
generate/cleanup, ads generate, Voice). They need to see remaining usage
credit, buy extra usage credit when the pool is low, and see
subscription prices on public Pricing. Today that product is
unspecified: the application has a stub Usage row, and the Placis
website has no Pricing.

## Goals

1. Show **Pricing** on the Placis website. Self-serve Choose is Placis Pro plan
   / month. Amounts are baked at `astro build` from the billing catalogue (not
   hardcoded in the Astro source). Choose on Placis Pro plan goes to
   `app.placis.com` (09 Checkout). Enterprise plan is contact sales. No checkout
   on `placis.com`. No Stripe on `placis.com`.
2. Website activation Checkout is the access fee plus Placis Pro plan /
   month on the same pay. The first pay includes one month of included
   usage credit. Later months grant included usage credit when the
   monthly invoice is paid. Unused usage credit carries over to the next
   month (the new included amount is added; remaining is not zeroed).
3. Let the owner buy **extra usage credit** into the same pool. No
   auto-reload.
4. **Usage & billing** shows remaining usage credit and **one bar**: the current
   pool (including carry-over); filled is spent this period (their cost),
   colored Voice / Image / text edits; unfilled is remaining. Not our cost. No
   pie. No line items. On the same screen they **Cancel subscription** (takes
   effect at period end) and, after `canceled`, pay again (Placis Pro plan /
   month). Change plan to other tiers is deferred.
5. Warn when about 20% of the current pool remains. When the pool is
   empty, billed work stops: **you are out of usage credit**, with a
   path to buy extra usage credit. If they stop paying the subscription
   price, the website stays published for three calendar months; then it
   is unpublished and they cannot Publish until the subscription is
   active again.

## Non-Goals

1. Do not put checkout on the Placis website. Do not put a Worker or
   Stripe JS on `placis.com`.
2. Do not commit to Clerk Billing. Do not use Stripe meters as the
   usage credit pool.
3. Do not bill onboarding or the onboarding guide.
4. Do not show our cost. Do not port predecessor dashboard Usage &
   billing copy, Codex 5-hour / weekly caps, or auto-reload.
5. Do not ship yearly billing, Plus / Max self-serve Choose, Change
   plan / proration, Stripe Tax / VAT, coupons, trials, or hosted
   billing portal in this spec.

## Catalogue

Charged amounts live on Stripe Product + Price. The application cache
and public Pricing bake **read** those euros. Predecessor EUR 4900 and
placis-web USD grid amounts are not source of truth.

Blurbs and feature lists stay copy (same card layout as the placis-web
pricing grid). Don't say: build credits.

Self-serve choosable: **Placis Pro plan / month** only. Included usage
credit for that Price is on the Product / cache (granted monthly when
the invoice is paid). Plus / Max are unspecified. Yearly is out of this
spec. Enterprise plan is contact sales. Website counts:
[plans.md](plans.md).

Website activation is the one-time access fee on the same 09 Checkout
as Placis Pro plan / month. That access fee is never charged again.

Display currency is **EUR**.

## User stories

1. As a contractor, I see Pricing on placis.com so I know the
   subscription price before I start.
2. As an owner, I open Usage & billing from the account menu and see
   remaining usage credit and how this period’s spend splits across
   Voice, Image, and text edits.
3. As an owner, unused usage credit is still there next month, plus the
   new included amount.
4. As an owner, when I am running out I am warned; when I am out, billed
   work stops until I buy extra usage credit.
5. As an owner, I cancel from Usage & billing. I do not go to placis.com
   for that. After cancel takes effect I pay again from Usage & billing
   (Placis Pro plan / month; I do not pay the access fee again).
6. As an owner, if I stop paying the subscription price, every website
   stays up for three calendar months; then they are unpublished and I
   cannot Publish until I pay again.

## Acceptance

1. Pricing is on the Placis website at `/pricing/`, linked from the top
   bar and footer. Amounts are baked at build from the billing
   catalogue. Self-serve Choose is Placis Pro plan / month →
   `app.placis.com`. First 09 Checkout is activation Price plus that
   Placis Pro plan / month. Enterprise plan is contact sales. No Stripe
   on `placis.com`.
2. Usage & billing is not a left-nav peer of Sites / Ads. It is on the
   account menu. Settings and Log out stay hidden.
3. The spend bar is one bar for the current pool. Filled segments are
   Voice / Image / text edits. Nested image or ads work during Voice is
   Image or text edits, not Voice. Money on screen is EUR.
4. 20% remaining and empty use the shared notification (not Details OK /
   Revert). Empty copy: **you are out of usage credit**, with a link to
   Usage & billing.
5. Unused usage credit carries over. Extra usage credit is the same
   pool. First paid month includes one month of included usage credit.
6. Failed pay does not unpublish on the first failed invoice. After
   three calendar months of non-payment every website is unpublished.
   Publish and live website rollback fail until the subscription is
   `active` again (**402** `subscription_canceled`, not
   `usage_credit_exhausted`). Usage & billing is the path to pay again.
   They can still edit the unpublished websites.
7. Cancel subscription is on Usage & billing. Cancel is at period end;
   until then they can still Publish. Keep subscription undoes a
   scheduled cancel. After the period ends, pay-again is Placis Pro plan / month
   Checkout (no access fee). Refunds do not un-activate the tenant or
   let a second payer in.
