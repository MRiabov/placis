# Billing design decision record

Look and interaction for Usage & billing and Pricing. Architecture belongs in
[ADR.md](ADR.md). The mock is [`apps/demo/`](../../../apps/demo/README.md) `/cms/billing`. Public Pricing look is the
placis-web pricing grid (not predecessor dashboard Usage & billing copy).

Status: decided (2026-08-29). **Why** omitted unless the owner writes it.

## Decisions

1. **Usage & billing is an account-menu screen** — Click the user icon (Clerk
   photo / `cms-account-trigger`). The popover includes **Usage & billing**. Not
   a left-nav peer of Sites / Ads. Hide the stub **Usage** rail item. Do not
   unhide Settings or Log out. Overlay destinations stay Sites / Profile
   children / Ads / Leads.
   - 2026-08-29: Leads 2026-09-04
   - 2026-08-28: Previous: left-nav place unset; “Usage is a CMS assistant
     screen”.

2. **Spend is one bar** — Current pool (including carry-over) vs spent this
   period. Filled segments colored Voice / Image / text edits. Unfilled is
   remaining. No pie. No line items. Not our cost.

3. **Pricing clones the placis-web pricing grid** — Three self-serve cards plus
   an Enterprise plan row. Month / year toggle. Blurb + feature list. Included
   usage credit is USD (`$100` / `$400` / `$1,500` a month). Choose goes to
   `app.placis.com` with no plan parameter (does not set `subscription_tier`).
   Contact sales goes to `/support/`. No Stripe on `placis.com`. Do not port
   predecessor dashboard Usage & billing copy. Don't say: build credits.
   - 2026-08-29: Choose does not set `subscription_tier` 2026-09-03
   - 2026-08-29: Previous: included usage credit only, as a unitless count, no
     feature list.
   - 2026-09-03, later: bake EUR amounts at `astro build` from `GET
     /v1/billing/catalog`. No year toggle. Choose on Placis Pro plan / month
     goes to 09. Plus / Max unspecified (no Choose). No Stripe JS / Worker on
     `placis.com`.

4. **20% and empty share the shared notification** — Fixed bottom-right. Not the
   Details OK / Revert pair. 20% warns. Empty: **you are out of usage credit**,
   with a path to extra usage credit.

5. **Stopped paying navigates Publish to Usage & billing, not a notification** —
   **Publishing is blocked:** **Pay the subscription price to Publish**
   **navigates to** Usage & billing. Not the 20% / empty notification.

6. **Change plan is the Pricing card grid; cancel is quiet** — Under extra usage
   credit: month / year, three self-serve cards, Enterprise plan row. Same card
   layout as placis.com `/pricing/` and the placis-web pricing grid (blurb +
   feature list; included usage credit in USD). Current is marked. Checkout
   stays on this screen. **Cancel subscription** is secondary. While cancel is
   scheduled: **Keep subscription**.
   - 2026-08-29: Previous: compact name/price list, then included usage credit
     only with no feature list.
   - 2026-09-03, later: Change plan while `active` is deferred. Pay-again after
     `canceled` is Pro month Checkout (no access fee). Cancel / Keep stay. Money
     is EUR.

7. **Usage & billing is a pool card, then the plan grid** — Remaining is a large
   USD figure in a raised card with the bar (unfilled track is remaining) and
   extra usage credit. Change plan heading shares a row with month / year.
   Current card is marked; **Choose** is short. When the subscription is not
   active, **Choose** is the primary. Cancel sits after a hairline as quiet
   text; **Keep subscription** is ink.
   - 2026-08-29: Previous: remaining and the bar sat loose above the grid;
     Cancel was an outline button under the cards.
   - 2026-09-03, later: remaining is a large EUR figure. No month / year row.
     When not `active`, **Choose** is Pro month pay-again.
