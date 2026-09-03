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

3. **Do not commit to Clerk Billing yet** — Already decided in 08. Optimistic
   subscription status in Postgres; refresh when expected. (2026-08-29)

4. **Onboarding is not billed** — Including the onboarding guide. Still record
   `ai_generations`. (2026-08-29)

5. **One usage credit pool, with carry-over** — Monthly included usage
   credit (by subscription tier) plus extra usage credit purchases. Unused
   remaining carries over: insert a new `included_usage_credit` row; do not
   reset remaining. Two vendor cost shapes, same ×5 into that pool. No
   auto-reload, no rolling 5-hour / weekly caps. Self-serve: Placis Pro plan /
   Placis Pro Plus plan / Placis Pro Max plan. Enterprise plan is sales-led,
   not a self-serve plan id. Usage credit is Postgres only (not Stripe).
   (2026-08-29; `included_usage_credit` enum 2026-09-01)

6. **Nested tool work during Voice is not the Voice minute** — Cleanup,
   generate_image, and ads generate during Voice spend the same usage credit
   and show as Image or Text on the bar, not Voice. (2026-08-29)

7. **Exhausted usage credit is 402** — Billed HTTP is `usage_credit_exhausted`.
   Check remaining usage credit before creating a billed realtime connection.
   ([errors](../../general-architecture/api.md)). (2026-08-29)

8. **`internal/billing` is the AI use ledger plus Usage & billing HTTP** —
   Extra usage credit checkout, Change plan / cancel / keep live here.
   Activation Stripe stays on 08. 20% / empty is frontend from
   `BillingUsageRead`. (2026-08-29; subscription-tier checkout on this package
   2026-08-29; named HTTP 2026-09-01)

9. **Pricing is the Placis website page** — Astro static, `placis.com/pricing/`.
   Usage & billing is the in-app screen. Checkout is not on `placis.com`.
   Change plan and Cancel subscription are not on `placis.com`.
   (2026-08-29)

10. **Usage & billing shows one bar of owner-cost spend** — Current pool
    (including carry-over) vs spent this period; spent segments colored by
    usage category (Voice / Image / Text). AI use ledger rows carry the
    category. Do not expose our cost. (2026-08-29)

11. **Stopped paying blocks website publication** — Unpublish the live website.
    `POST /v1/website/publications` and live website rollback are **402**
    `subscription_canceled` until `subscription_status=active`. Not
    `usage_credit_exhausted` (that sends them to extra usage credit). Not 08
    (tenant stays `status=active`; they can still edit). Resume pay from Usage
    & billing. Status enum is `canceled`. (2026-08-29)

12. **Change plan and cancel are Usage & billing** — Not the placis.com Pricing
    grid and not predecessor dashboard Usage & billing copy. Cancel is
    `cancel_at_period_end`; Keep subscription undoes it. Pay-again after
    `canceled` is Change plan checkout. (2026-08-29)

13. **`ai` records our usage and their usage** — Every vendor-hit `ai`
    call **writes** `ai_generations` (**our usage**). **Their usage** is
    `RecordAIUseSpend` from that implementation when `bill_usage` is
    `billed` or `bill-allow-out-of-balance` with remaining > 0. Argument
    `bill_usage: BillUsageMode` is the generic spend enum (not AI-only;
    ETL `StartRun` takes it too). Tenant for an `ai` call is
    `threads.tenant_id`. Features do not debit after an `ai` call.
    Compaction and owner `DescribeImage` use
    `bill-allow-out-of-balance`. Onboarding / `eval` / ETL (for now)
    use `unbilled`. (2026-09-03)
