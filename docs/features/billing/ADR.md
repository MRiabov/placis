# Billing Decision Record

Status: decided (2026-08-29, product owner + engineering). The spec docs in
this directory say *what* we build; this record says *why* we chose what we
did.

How to use this file: when a decision changes, update the entry (keep the old
decision and date as a note) instead of silently replacing the old entry. Add
new entries with the next number, the area, and the date.

## Decisions

1. **Billing owns the AI use ledger** — Remaining usage credit is not a column
   on `tenants`. `tenants` keeps only optimistic `subscription_status`.
   (2026-08-29)

2. **Website activation checkout stays in 08** — Billing does not steal
   `website_activations` or activation Stripe.
   ([09](../onboarding/pipeline/09-website-activation.md)). (2026-08-29)
   - 2026-09-03, later: activation Checkout is 09. Line items are the activation
     Price plus Pro month (not activation-only).

3. **Do not commit to Clerk Billing yet** — Already decided in 08. Optimistic
   subscription status in Postgres; refresh when expected. (2026-08-29)
   - 2026-09-06: “in 08” is website activation, now 09.

4. **Onboarding is not billed** — Including the onboarding guide. Still record
   `ai_generations`. (2026-08-29)

5. **One usage credit pool, with carry-over** — Monthly included usage credit
   (by subscription tier) plus extra usage credit purchases. Unused remaining
   carries over: insert a new `included_usage_credit` row; do not reset
   remaining. Two vendor cost shapes, same ×5 into that pool. No auto-reload, no
   rolling 5-hour / weekly caps. Self-serve: Placis Pro plan / Placis Pro Plus
   plan / Placis Pro Max plan. Enterprise plan is sales-led, not a self-serve
   plan id. Usage credit is Postgres only (not Stripe). (2026-08-29)
   - 2026-09-01: `included_usage_credit` enum.

6. **Nested tool work during Voice is not the Voice minute** — Cleanup,
   generate_image, and ads generate during Voice spend the same usage credit and
   show as Image or Text on the bar, not Voice. (2026-08-29)

7. **Exhausted usage credit is 402** — Billed HTTP is `usage_credit_exhausted`.
   Check remaining usage credit before creating a billed realtime connection.
   ([errors](../../general-architecture/api.md)). (2026-08-29)

8. **`internal/billing` is the AI use ledger plus Usage & billing HTTP** — Extra
   usage credit checkout, Change plan / cancel / keep live here. Activation
   Stripe stays on 08. 20% / empty is frontend from `BillingUsageRead`.
   (2026-08-29)
   - 2026-08-29: subscription-tier checkout on this package.
   - 2026-09-01: named HTTP.
   - 2026-09-03, later: Change plan while `active` is deferred; pay-again /
     cancel / keep stay. Activation Checkout is 09, not 08.

9. **Pricing is the Placis website page** — Astro static, `placis.com/pricing/`.
   Usage & billing is the in-app screen. Checkout is not on `placis.com`. Change
   plan and Cancel subscription are not on `placis.com`. (2026-08-29)
   - 2026-08-29: Choose does not set `subscription_tier` (no plan parameter).
     First `ActivateSubscription` is Placis Pro plan. Plus / Max / year is
     Change plan after they are `active`.
   - 2026-09-03, later: amounts from Stripe Prices (Postgres cache). Choose on
     Placis Pro plan goes to 09 (Pro month). Yearly and Change plan to other
     tiers are deferred. CI bakes `/pricing/` from `GET /v1/billing/catalog`. No
     Stripe JS on `placis.com`.

10. **Usage & billing shows one bar of owner-cost spend** — Current pool
    (including carry-over) vs spent this period; spent segments colored by usage
    category (Voice / Image / Text). AI use ledger rows carry the category. Do
    not expose our cost. (2026-08-29)

11. **Stopped paying blocks website publication** — Unpublish the live website.
    `POST /v1/websites/{website_prefix}/publications` and live website rollback
    are **402** `subscription_canceled` until `subscription_status=active`. Not
    `usage_credit_exhausted` (that sends them to extra usage credit). Not 08
    (tenant stays `status=active`; they can still edit). Resume pay from Usage &
    billing. Status enum is `canceled`. (2026-08-29)
    - 2026-09-03, later: unpublish after **three calendar months** of
      non-payment (`nonpayment_started_at`), not on the first failed invoice.
      Deadline job **retrieves** Stripe before `UnpublishWebsite`. Unpublish
      walks every website (ADR 16). Nested publication HTTP is
      `/v1/websites/{website_prefix}/publications`.
    - 2026-09-06: “Not 08” in the 2026-08-29 prose is website activation,
      now 09. Unpublish still does not un-activate the tenant.

12. **Change plan and cancel are Usage & billing** — Not the placis.com Pricing
    grid and not predecessor dashboard Usage & billing copy. Cancel is
    `cancel_at_period_end`; Keep subscription undoes it. Pay-again after
    `canceled` is Change plan checkout. (2026-08-29)
    - 2026-09-03, later: pay-again is Pro month Checkout (no activation Price).
      Change plan while `active` is deferred.

13. **`ai` records our usage and their usage** — Every vendor-hit `ai` call
    **writes** `ai_generations` (**our usage**). **Their usage** is
    `RecordAIUseSpend` from that implementation when `bill_usage` is `billed` or
    `bill-allow-out-of-balance` with remaining > 0. Argument `bill_usage:
    BillUsageMode` is the generic spend enum (not AI-only; ETL `StartRun` takes
    it too). Tenant for an `ai` call is `threads.tenant_id`. Features do not
    debit after an `ai` call. Compaction and owner `DescribeImage` use
    `bill-allow-out-of-balance`. Onboarding / `eval` / ETL (for now) use
    `unbilled`. (2026-09-03)

14. **Website count cap (self-serve)** — Count of `websites` rows: Placis Pro
    plan 1, Placis Pro Plus plan 3, Placis Pro Max plan 5. `POST /v1/websites`
    at the cap is **402** `website_limit_reached` (not `subscription_canceled`,
    not `usage_credit_exhausted`) so Usage & billing can send them to Change
    plan. Count + insert in one transaction. Onboarding’s first website is
    always allowed on Placis Pro plan. Downgrade while over the cap does not
    delete websites. Enterprise plan 20 is deferred (no `subscription_tier`
    value). Catalogue: [plans.md](plans.md). (2026-09-03)

15. **CMS website copy generation is billed** — `POST /v1/websites` inserts
    `website_copy_generation` with `bill_usage=billed`. Empty usage credit →
    **402** `usage_credit_exhausted` and no `websites` row. Onboarding stays
    unbilled (ADR 4). (2026-09-03)

16. **Unpublish walks every website** — Amend 11: when they stop paying,
    `UnpublishWebsite` holding-pages every website for that tenant. After three
    calendar months of non-payment, or owner-scheduled cancel at period end —
    not on the first failed invoice. (2026-09-03)

17. **Stripe Prices are the catalogue** — Charged amounts live on Stripe Product
    and Price. Postgres `billing.prices` is the cache Checkout and catalogue GET
    **read**. `product.*` / `price.*` webhooks **insert** `billing_catalog_sync`
    (`event_id`); worker applies that payload. Empty cache / boot **inserts**
    one full-list sync. Not `Prices.List` on Checkout or GET catalogue. Not
    Clerk Billing. Not Stripe meters. (2026-09-03)

18. **09 Checkout is activation Price plus Pro month** — One Checkout
    (`mode=subscription` + one-time line). Access fee never charged again. First
    pay includes one month of included usage credit (`invoice.paid` /
    `AddIncludedUsageCredit`; unique Stripe invoice id). `ActivateSubscription`
    **persists** `billing.subscriptions` from that Checkout; it does not create
    a second Stripe Subscription. (2026-09-03)

19. **Owner-facing money is EUR numeric** — Not integer cents. AI use ledger
    `amount_eur` has scale for ×5 of sub-cent vendor invoices. Stripe
    `unit_amount` converts at the adapter. (2026-09-03)

20. **Refunds are money-only** — `payment_status=refunded`. Tenant stays
    `active`. First payer stays owner; refund does not reopen 09. Extra usage
    credit row stays. (2026-09-03)

21. **Public catalogue GET is unauthenticated** — Choosable Prices only (Pro
    month). No `stripe_customer_id`. No activation Price. CI `astro build` bakes
    `/pricing/` from that GET. (2026-09-03)
