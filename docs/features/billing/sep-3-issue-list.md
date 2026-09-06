# Sep 3 issue list — Billing

Reclassified 2026-09-03 against [ADR.md](ADR.md). PR
[#88](https://github.com/MRiabov/placis/pull/88) (Stripe Prices /
09 Website activation Checkout subscribes) closed several items; do
not re-open those as drops. Bold numbers are original audit ids (not
compacted).

Usage credit is tight. The subscription half is **ADR 5 / 11 / 12**,
not unused-spec. Closed in this PR: Pricing Choose consumer (Placis Pro
plan / month into 09), yearly out of spec, subscription in scope, EUR
from Stripe Prices, activation is 09, Change plan to other tiers
deferred.

## Keep (ADR)

- **7. Three tiers (included usage credit amount)**
  Comment: ADR 5: tier sets the monthly included usage credit, not a
  capability gate. Keep Pro / Plus / Max + sales-led Enterprise.
  In-app switching while `active` is deferred (`409`).

- **8. `POST /v1/billing/subscription/keep`**
  Comment: ADR 12: Cancel is `cancel_at_period_end`; Keep undoes it.
  Do not make Cancel terminal.

## Doc gap

- **4. `spent_this_period_*` vs three segments**
  Comment: under EUR `numeric` rounded segments need not sum
  to the bar fill.
  Action: `api.md`: total is authoritative filled length; segments
  are display splits. Do not drop the total.

- **5. Clerk Billing / Stripe meters ban restated**
  Comment: canonical is ADR 3 (and ADR 17). Echoes in PRD
  / architecture / README.
  Action: keep the ADR; trim echoes.

- **9. `subscription_price_*` looks derivable**
  Comment: Stripe Prices are never overwritten; archived
  `billing.prices` rows can differ from today’s choosable Price.
  Action: `GET /v1/billing/usage` reads the *subscribed* Price row.

- **12. `ai_use_ledger_entries.period_started_at`**
  Comment: “spent this period” needs a floor. Name the query (latest
  included usage credit `period_started_at`) in `api.md`.

## False alarms (closed)

- **6. Subscription lifecycle vs “activation-only Stripe”** — ADR 5,
  11, 12 already decided included usage credit, unpublish on
  non-payment, cancel/keep/pay-again. ADR 18: 09 Website
  activation Checkout *is* `mode=subscription`. Delete this item;
  keep the machinery.

- **1. Pricing Choose** — display only; Pro/month only; no plan
  parameter. Plus/Max/yearly `choosable=false`.

- **2. Yearly `billing_interval`** — dropped (`month` only).

- **7 (partial)** — Change plan while `active` is `409`.

- **10. EUR vs USD** — owner-facing money EUR; amounts from Stripe
  Prices.

- **11. Stale “08” in billing PRD / ADR 2** — activation Checkout is
  09 Website activation. Residual: onboarding ADR 16 (onboarding
  item 16).
