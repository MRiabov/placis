# Billing — E2E test

One full-stack E2E when `internal/billing` lands. Voice settlement is
not wall-clock. DB asserts name the tables from
[persistence.md](persistence.md). Public 1:1 is the Route rows below.
Extra Integration asserts spend. Go `func TestHappyPath*` leftover until
they exist. No Go tests in this docs PR. Billing has no pipeline
(`TestPipelineHappyPathBilling*` does not exist).

Stripe test mode. Period rollover via test clocks or injected
signature-verified webhooks. Catalogue rows are fixtures in
`billing.prices` (or a prior `billing_catalog_sync`); tests do not
`Prices.List` on Checkout or catalogue GET.

## E2E

### Activate through cancel

#### Setup

E2E (Playwright, both sides). Playwright drives `frontend-2` against the
real API + real Postgres. Website activation (09) already succeeded so
`ActivateSubscription` can run. Cache has an active activation Price and
a choosable Pro month Price.

#### Exercise

1. **Activate** — website activation succeeds (09 Checkout:
   activation Price plus Pro month). River job kind
   `website_activation` **calls** `ActivateSubscription`. First
   `invoice.paid` **inserts** `billing_subscription_sync` and **calls**
   `AddIncludedUsageCredit`.
2. **Billed work** — assistant text, image generate, and Voice minutes
   use `bill_usage=billed` (usage categories Voice / Image / text
   edits).
3. **Carry-over** — next `invoice.paid` on `POST /v1/webhooks/stripe`
   **inserts** `billing_subscription_sync`; **calls**
   `AddIncludedUsageCredit`. Remaining is not zeroed.
4. **20%** — remaining drops to 20% of the current pool
   (`GET /v1/billing/usage` → `BillingUsageRead`).
5. **Empty** — remaining hits 0. `POST /v1/billing/extra-usage-credit/checkout`
   then paid webhook **inserts** `billing_extra_usage_credit`;
   `ApplyExtraUsageCredit` restores billed work.
6. **Failed pay (window)** — `invoice.payment_failed` sets
   `nonpayment_started_at`. Publish still works. `subscription_status`
   stays `active`.
7. **Stopped paying (deadline)** — `billing_nonpayment_unpublish` after
   three calendar months **retrieves** Stripe still unpaid, sets
   `subscriptions.status=canceled` and
   `tenants.subscription_status=canceled`. `canceled_at` is set.
   **Calls** `UnpublishWebsite`. Pay-again:
   `POST /v1/billing/subscription/checkout`; paid webhook **inserts**
   `billing_subscription_sync`.
8. **Cancel** — owner cancels; period has not ended.
   `POST /v1/billing/subscription/cancel` (`CancelSubscription`).
9. **Keep** — `POST /v1/billing/subscription/keep`
   (`KeepSubscription`) clears the flag. After `current_period_end`.

#### Verify

1. **Activate** — **persists into** `billing.subscriptions`
   (`subscription_tier=pro`, `billing_interval=month`, `status=active`,
   `stripe_customer_id` set, `stripe_subscription_id` set). One
   `included_usage_credit` row for the first invoice (`stripe_invoice_id`
   unique; not a second row from `checkout.session.completed`).
   `tenants.subscription_status=active`. Amounts match cached Prices
   (not a Go 4900).
2. **Billed work** — **persists into** `ai_use_ledger_entries`
   (`entry_kind=spend`, `usage_category`, `amount_eur`). UI: Usage &
   billing (account menu) shows the bar split from `BillingUsageRead`
   (EUR).
3. **Carry-over** — schema `jobs` River job kind
   `billing_subscription_sync`; a second `included_usage_credit` row;
   remaining is prior remaining plus the new included usage credit.
4. **20%** — UI: shared notification (not Details OK / Revert); link to
   Usage & billing.
5. **Empty** — billed routes **402** `usage_credit_exhausted`
   (`AssertUsageCredit`). UI: **you are out of usage credit**. Schema
   `jobs` `billing_extra_usage_credit`; `extra_usage_credit` row after
   paid Checkout.
6. **Failed pay (window)** — live websites still published. Publish
   **200**. `nonpayment_started_at` set.
7. **Stopped paying (deadline)** — no `website_publications.active`; R2
   `latest/` is the holding HTML. `POST /v1/websites/{website_prefix}/publications`
   and live website rollback **402** `subscription_canceled` (not
   `usage_credit_exhausted`). UI: Publish dropdown **Publishing is
   blocked:** navigate to Usage & billing. Website editor PATCH still
   works. Pay-again: new `stripe_subscription_id`; same
   `stripe_customer_id`; `status=active`; `canceled_at` cleared; no
   activation Price on that Checkout. Publish succeeds.
8. **Cancel** — `cancel_at_period_end=true`, `status=active`. UI:
   **Cancels on** the period end. Publish still works.
9. **Keep** — `cancel_at_period_end` cleared. After
   `current_period_end` without Keep: `status=canceled`, `canceled_at`
   set; **calls** `UnpublishWebsite` (owner-cancel path, not the
   three-month job).

#### Mocked

Stripe test mode and the LLM. Deadline beat may inject `nonpayment_started_at`
in the past plus a signature-verified unpaid invoice, or use a Stripe test
clock.

## Integration

### TestHappyPathV1BillingCatalog — Route

1:1. Exercise names exactly one Method+path.

#### Setup

Backend (`humatest`, Testcontainers Postgres). Fixture choosable Pro
month row on `billing.prices`. No Clerk JWT. No `frontend-2`.

#### Exercise

`GET /v1/billing/catalog`.

#### Verify

200 `BillingCatalogRead`. Pro month `amount_eur` and
`included_usage_credit_eur` from the cache. No activation Price. No
`stripe_customer_id`.

#### Fail

Empty cache → 200 with empty `prices` (no invented amounts).

#### Mocked

None (no Stripe on this GET).

### TestHappyPathV1BillingUsage — Route

1:1. Exercise names exactly one Method+path.

#### Setup

Backend (`humatest`, Testcontainers Postgres). Fake Stripe. Clerk JWT
active tenant. `billing.subscriptions` from 09 fixture. No
`frontend-2`.

#### Exercise

`GET /v1/billing/usage`.

#### Verify

200 `BillingUsageRead`. Remaining is the AI use ledger sum (not our
cost). `subscription_status=active`. Money fields `*_eur`.

#### Mocked

Stripe.

### TestHappyPathV1BillingExtraUsageCreditCheckout — Route

1:1. Exercise names exactly one Method+path.

#### Setup

Backend (`humatest`, Testcontainers Postgres). Fake Stripe. Clerk JWT
active tenant. `billing.subscriptions` from 09 fixture. No
`frontend-2`.

#### Exercise

`POST /v1/billing/extra-usage-credit/checkout`. Request
`BillingExtraUsageCreditCreate` (`amount_eur`). Response
`BillingCheckoutRead`.

#### Verify

200. `checkout_url` set. Does not **persist into**
`ai_use_ledger_entries` on this POST. No webhook in Exercise.

#### Mocked

Stripe.

### TestHappyPathV1BillingSubscriptionCheckout — Route

1:1. Exercise names exactly one Method+path. Pay-again after
`canceled`. Active Change plan is deferred (`409`).

#### Setup

Backend (`humatest`, Testcontainers Postgres). Fake Stripe. Clerk JWT
active tenant. `billing.subscriptions` from 09 fixture
(`status=canceled`). Choosable Pro month Price in cache. No
`frontend-2`.

#### Exercise

`POST /v1/billing/subscription/checkout`. Request
`BillingSubscriptionCheckoutCreate`. Response `BillingCheckoutRead`.

#### Verify

200. `checkout_url` set. Does not attach an activation Price. Does not
**persist into** `subscriptions` on this POST (paid webhook does).

#### Fail

`status=active` → **409**. Missing Pro month Price → fail closed (no
`price_data`).

#### Mocked

Stripe.

### TestHappyPathV1BillingSubscriptionCancel — Route

1:1. Exercise names exactly one Method+path.

#### Setup

Backend (`humatest`, Testcontainers Postgres). Fake Stripe. Clerk JWT
active tenant. `billing.subscriptions` from 09 fixture
(`status=active`). No `frontend-2`.

#### Exercise

`POST /v1/billing/subscription/cancel`. Response `BillingUsageRead`.

#### Verify

200. `cancel_at_period_end=true`, `status=active`.

#### Fail

`status=canceled` → **409**.

#### Mocked

Stripe.

### TestHappyPathV1BillingSubscriptionKeep — Route

1:1. Exercise names exactly one Method+path.

#### Setup

Backend (`humatest`, Testcontainers Postgres). Fake Stripe. Clerk JWT
active tenant. `billing.subscriptions` from 09 fixture
(`status=active`, `cancel_at_period_end=true`). No `frontend-2`.

#### Exercise

`POST /v1/billing/subscription/keep`. Response `BillingUsageRead`.

#### Verify

200. `cancel_at_period_end` cleared. `status=active`.

#### Fail

`status=canceled` → **409**.

#### Mocked

Stripe.

### BillUsage modes

Backend integration
([test types](../../general-architecture/testing.md#test-types)).
Handler → service → sqlc is real. Not a unit test of
`BillUsageMode`. Does not replace billing Route 1:1 rows. Numbered
remaining drops live here.

#### Setup

Backend (`humatest`, Testcontainers Postgres + MinIO). Tenant already
`status=active` with `billing.subscriptions` from 09 fixture.
Remaining is included usage credit. Fake LLM with **known our cost**
(×5 their-cost is a known `#` in EUR after dated FX). Fake Stripe.
Prefer fake Clerk. Fake voice `AssistantVoiceUsage`. No `frontend-2`.
No Worker container.

#### Exercise

1. **Balance** — `GET /v1/billing/usage`.
2. **`billed`** — `GET /v1/assistant/thread/ws` (CMS text). Then
   `GET /v1/billing/usage`.
3. **Voice** — `POST /v1/assistant/voice/transcripts`. Then
   `GET /v1/billing/usage`.
4. **`bill-allow-out-of-balance`** —
   `POST /v1/media-assets/{id}/confirm-upload` **inserts**
   `describe_image`; wait-end `DescribeImage`. Then
   `GET /v1/billing/usage`. Remaining 0; wait-end `DescribeImage`
   again.
5. **`unbilled`** — **calls** `StartRun` (`bill_usage=unbilled`). Then
   `GET /v1/billing/usage`.

#### Verify

1. **Balance** — `BillingUsageRead` remaining is the AI use ledger
   sum (included usage credit; not our cost).
2. **`billed`** — `BillingUsageRead.remaining_usage_credit_eur`
   dropped by the known text `#`. `spent_text_eur` that `#`.
   Persistence may supplement: `ai_generations.cost_amount` (**our
   usage**, vendor currency); spend row (**their usage**, `amount_eur`).
3. **Voice** — remaining dropped by the known voice `#`.
   `spent_voice_eur` that `#`. Settlement **200**.
4. **`bill-allow-out-of-balance`** — remaining > 0: remaining dropped
   by the known image `#`. Remaining 0: wait-end still succeeds (not
   captioning-failed); remaining unchanged that beat.
5. **`unbilled`** — remaining unchanged on `GET /v1/billing/usage`.

#### Fail

Remaining already 0. Billed edits stop; website copy PATCH does not.

- `GET /v1/assistant/thread/ws` → **402** `usage_credit_exhausted`
  (no vendor; remaining unchanged on `GET /v1/billing/usage`).
- `POST /v1/assistant/voice/realtime-connection` → **402**.
  Transcripts settlement still **200** if a connection had already
  run.
- `POST /v1/media-assets/{id}/image-edits` → **402**.
- `POST /v1/ads/{ad_id}/generate` and
  `POST /v1/ads/{ad_id}/variants/{variant_id}/rewrite` → **402**
  (generate **402** before enqueue).
- Owner `DescribeImage` at remaining 0 is Verify beat 4, not this
  Fail.
- `PATCH /v1/website/editor/pages/{page_id}` still **200**.

#### Mocked

Stripe. LLM. Voice usage body. Clerk.

### Humatest billing

Backend flow. Does not replace the 1:1 rows. Numbered remaining drops
are `### BillUsage modes`.

#### Setup

Backend (`humatest`, Testcontainers Postgres). Tenant already
`status=active` with `billing.subscriptions` from 09 fixture. Cache
has activation + Pro month Prices. Fake Stripe. No `frontend-2`. No
Playwright.

#### Exercise

1. **Usage** — `GET /v1/billing/usage`.
2. **Spend** — billed `ai` generate (`bill_usage=billed`). Then
   `GET /v1/billing/usage`.
3. **Extra usage credit** — `POST /v1/billing/extra-usage-credit/checkout`.
   Paid `POST /v1/webhooks/stripe` **inserts**
   `billing_extra_usage_credit`.
4. **Period clock** — `invoice.paid` on `POST /v1/webhooks/stripe`
   **inserts** `billing_subscription_sync` (**calls**
   `AddIncludedUsageCredit`). Replay the same invoice id.
5. **Cancel** — `POST /v1/billing/subscription/cancel`.
6. **Keep** — `POST /v1/billing/subscription/keep`.
7. **Failed pay** — `invoice.payment_failed` **inserts**
   `billing_subscription_sync` (sets `nonpayment_started_at`; does not
   unpublish).
8. **Deadline unpaid** — `billing_nonpayment_unpublish` with elapsed
   clock and Stripe still unpaid (**calls** `UnpublishWebsite`).
9. **Deadline paid (missed webhook)** — elapsed clock and Stripe paid:
   clear clock; grant if needed; do not unpublish.
10. **Pay-again** — `POST /v1/billing/subscription/checkout` when
    `canceled`; paid webhook **inserts** `billing_subscription_sync`.
11. **Catalogue webhook** — `price.*` **inserts** `billing_catalog_sync`
    (upserts that row; not `Prices.List`).

`POST /v1/webhooks/stripe` is [onboarding HTTP](../onboarding/api.md),
not a billing Route.

#### Verify

1. **Usage** — `BillingUsageRead` remaining is the AI use ledger sum;
   `subscription_status=active`.
2. **Spend** — `ai_use_ledger_entries` `entry_kind=spend`, `amount_eur`.
3. **Extra usage credit** — schema `jobs` `billing_extra_usage_credit`;
   `extra_usage_credit` row after paid Checkout (`ApplyExtraUsageCredit`).
   Refund of that charge leaves the row.
4. **Period clock** — schema `jobs` `billing_subscription_sync`; a
   second `included_usage_credit` row; remaining is not zeroed. Replay
   does not insert a third row (`stripe_invoice_id`).
5. **Cancel** — `cancel_at_period_end=true`, `status=active`.
6. **Keep** — `cancel_at_period_end` cleared.
7. **Failed pay** — `nonpayment_started_at` set; Publish still works.
8. **Deadline unpaid** — `subscriptions.status=canceled`,
   `tenants.subscription_status=canceled`, `canceled_at` set. No
   `website_publications.active`.
   `POST /v1/websites/{website_prefix}/publications` **402**
   `subscription_canceled`.
9. **Deadline paid** — `nonpayment_started_at` cleared; still `active`;
   live website still published.
10. **Pay-again** — new `stripe_subscription_id`; same
    `stripe_customer_id`; `status=active`; `canceled_at` cleared.
11. **Catalogue webhook** — `billing.prices` upserted from payload.

#### Fail

`POST /v1/billing/subscription/cancel` and
`POST /v1/billing/subscription/keep` **409** when `status=canceled`.
`POST /v1/billing/subscription/checkout` **409** when `status=active`.

#### Mocked

Stripe.

### HappyPathBillingFull — frontend Full

Frontend. Vitest `HappyPathBillingFull`. Not OpenAPI 1:1.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go). Tenant active after website
activation (09).

#### Exercise

Account menu → Usage & billing. Extra usage credit. Cancel. Keep
subscription. Pay-again when not `active`. Publish blocked navigate to
Usage & billing. Remaining 0: billed composer and Voice stop (cannot send /
cannot start Voice). Website editor copy PATCH via MSW **200**. MSW:
`GET /v1/billing/usage`,
`POST /v1/billing/extra-usage-credit/checkout`,
`POST /v1/billing/subscription/checkout`,
`POST /v1/billing/subscription/cancel`, `POST /v1/billing/subscription/keep`,
`POST /v1/websites/{website_prefix}/publications` (**402**
`subscription_canceled` when canceled).

#### Verify

UI: usage bar (EUR), **you are out of usage credit**, billed composer
and Voice stop, link to Usage & billing. **Cancels on**, Keep clears
the flag, pay-again **Choose**, Publish blocked navigate to Usage &
billing. Website editor still accepts copy PATCH via MSW **200**. MSW
saw those Method+path strings. Postgres rows are the backend test.

#### Mocked

All HTTP via MSW.
