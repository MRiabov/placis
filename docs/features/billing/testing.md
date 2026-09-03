# Billing — E2E test

One full-stack E2E when `internal/billing` lands. Voice settlement is
not wall-clock. DB asserts name the tables from
[persistence.md](persistence.md). Public 1:1 is the five
`### TestHappyPath* — Route` below. Extra Integration asserts spend. Go
`func TestHappyPath*` leftover until they exist. No Go tests in this
docs PR. Billing has no pipeline (`TestPipelineHappyPathBilling*`
does not exist).

## E2E

### Activate through cancel

#### Setup

E2E (Playwright, both sides). Playwright drives `frontend-2` against the
real API + real Postgres. Website activation (09) already succeeded so
`ActivateSubscription` can run.

#### Exercise

1. **Activate** — website activation succeeds (09). River job kind
   `website_activation` **calls** `ActivateSubscription`.
2. **Billed work** — assistant text, image generate, and Voice minutes
   use `bill_usage=billed` (usage categories Voice / Image / text
   edits).
3. **Carry-over** — `invoice.paid` on `POST /v1/webhooks/stripe`
   **inserts** `billing_subscription_sync`; **calls**
   `AddIncludedUsageCredit`. Remaining is not zeroed.
4. **20%** — remaining drops to 20% of the current pool
   (`GET /v1/billing/usage` → `BillingUsageRead`).
5. **Empty** — remaining hits 0. `POST /v1/billing/extra-usage-credit/checkout`
   then paid webhook **inserts** `billing_extra_usage_credit`;
   `ApplyExtraUsageCredit` restores billed work.
6. **Stopped paying** — `billing_subscription_sync` sets
   `subscriptions.status=canceled` and
   `tenants.subscription_status=canceled`. `canceled_at` is set.
   **Calls** `UnpublishWebsite`. Pay-again:
   `POST /v1/billing/subscription/checkout`; paid webhook **inserts**
   `billing_subscription_sync`.
7. **Change plan** — owner picks Placis Pro Plus plan (or month/year)
   while `active`. `POST /v1/billing/subscription/checkout`
   (`CreateSubscriptionCheckout` Stripe update).
8. **Cancel** — owner cancels; period has not ended.
   `POST /v1/billing/subscription/cancel` (`CancelSubscription`).
9. **Keep** — `POST /v1/billing/subscription/keep`
   (`KeepSubscription`) clears the flag. After `current_period_end`.

#### Verify

1. **Activate** — **persists into** `billing.subscriptions`
   (`subscription_tier=pro`, `status=active`,
   `stripe_subscription_id` set); `ai_use_ledger_entries`
   `entry_kind=included_usage_credit` (Placis Pro plan catalogue).
   `tenants.subscription_status=active`.
2. **Billed work** — **persists into** `ai_use_ledger_entries`
   (`entry_kind=spend`, `usage_category`). UI: Usage & billing
   (account menu) shows the bar split from `BillingUsageRead`.
3. **Carry-over** — schema `jobs` River job kind
   `billing_subscription_sync`; a second `included_usage_credit` row;
   remaining is prior remaining plus the new included usage credit.
4. **20%** — UI: shared notification (not Details OK / Revert); link to
   Usage & billing.
5. **Empty** — billed routes **402** `usage_credit_exhausted`
   (`AssertUsageCredit`). UI: **you are out of usage credit**. Schema
   `jobs` `billing_extra_usage_credit`; `extra_usage_credit` row after
   paid Checkout.
6. **Stopped paying** — no `website_publications.active`; R2 `latest/`
   is the holding HTML. `POST /v1/website/publications` and live
   website rollback **402** `subscription_canceled` (not
   `usage_credit_exhausted`). UI: Publish dropdown **Publishing is
   blocked:** jump to Usage & billing. Website editor PATCH still
   works. Pay-again: new `stripe_subscription_id`; `status=active`;
   `canceled_at` cleared. Publish succeeds.
7. **Change plan** — `subscriptions.subscription_tier` updates; no
   extra `included_usage_credit` mid-period. UI: Change plan grid marks
   the new current tier **Current**.
8. **Cancel** — `cancel_at_period_end=true`, `status=active`. UI:
   **Cancels on** the period end. Publish still works.
9. **Keep** — `cancel_at_period_end` cleared. After
   `current_period_end` without Keep: `status=canceled`, `canceled_at`
   set; same as beat 6.

#### Mocked

Stripe and the LLM.

## Integration

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
cost). `subscription_status=active`.

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
`BillingExtraUsageCreditCreate`. Response `BillingCheckoutRead`.

#### Verify

200. `checkout_url` set. Does not **persist into**
`ai_use_ledger_entries` on this POST. No webhook in Exercise.

#### Mocked

Stripe.

### TestHappyPathV1BillingSubscriptionCheckout — Route

1:1. Exercise names exactly one Method+path. Active change-plan.
Pay-again stays on `### Humatest billing`.

#### Setup

Backend (`humatest`, Testcontainers Postgres). Fake Stripe. Clerk JWT
active tenant. `billing.subscriptions` from 09 fixture
(`status=active`). No `frontend-2`.

#### Exercise

`POST /v1/billing/subscription/checkout`. Request
`BillingSubscriptionCheckoutCreate`. Response `BillingCheckoutRead`.

#### Verify

200. `subscriptions.subscription_tier` updates. No extra
`included_usage_credit` mid-period.

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
(×5 their-cost is a known `#`). Fake Stripe. Prefer fake Clerk. Fake
voice `AssistantVoiceUsage`. No `frontend-2`. No Worker container.

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
2. **`billed`** — `BillingUsageRead.remaining_usage_credit_usd_cents`
   dropped by the known text `#`. `spent_text_usd_cents` that `#`.
   Persistence may supplement: `ai_generations.cost_amount` (**our
   usage**); spend row (**their usage**).
3. **Voice** — remaining dropped by the known voice `#`.
   `spent_voice_usd_cents` that `#`. Settlement **200**.
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
`status=active` with `billing.subscriptions` from 09 fixture. Fake
Stripe. No `frontend-2`. No Playwright.

#### Exercise

1. **Usage** — `GET /v1/billing/usage`.
2. **Spend** — billed `ai` generate (`bill_usage=billed`). Then
   `GET /v1/billing/usage`.
3. **Extra usage credit** — `POST /v1/billing/extra-usage-credit/checkout`.
   Paid `POST /v1/webhooks/stripe` **inserts**
   `billing_extra_usage_credit`.
4. **Period clock** — `invoice.paid` on `POST /v1/webhooks/stripe`
   **inserts** `billing_subscription_sync` (**calls**
   `AddIncludedUsageCredit`).
5. **Change plan** — `POST /v1/billing/subscription/checkout` while
   `status=active`.
6. **Cancel** — `POST /v1/billing/subscription/cancel`.
7. **Keep** — `POST /v1/billing/subscription/keep`.
8. **Stopped paying** — subscription deleted on
   `POST /v1/webhooks/stripe` **inserts** `billing_subscription_sync`
   (**calls** `UnpublishWebsite`).
9. **Pay-again** — `POST /v1/billing/subscription/checkout` when not
   `active`; paid webhook **inserts** `billing_subscription_sync`.

`POST /v1/webhooks/stripe` is [onboarding HTTP](../onboarding/api.md),
not a billing Route.

#### Verify

1. **Usage** — `BillingUsageRead` remaining is the AI use ledger sum;
   `subscription_status=active`.
2. **Spend** — `ai_use_ledger_entries` `entry_kind=spend`.
3. **Extra usage credit** — schema `jobs` `billing_extra_usage_credit`;
   `extra_usage_credit` row after paid Checkout (`ApplyExtraUsageCredit`).
4. **Period clock** — schema `jobs` `billing_subscription_sync`; a
   second `included_usage_credit` row; remaining is not zeroed.
5. **Change plan** — `subscriptions.subscription_tier` updates; no extra
   `included_usage_credit` mid-period.
6. **Cancel** — `cancel_at_period_end=true`, `status=active`.
7. **Keep** — `cancel_at_period_end` cleared.
8. **Stopped paying** — `subscriptions.status=canceled`,
   `tenants.subscription_status=canceled`, `canceled_at` set. No
   `website_publications.active`. `POST /v1/website/publications` **402**
   `subscription_canceled`.
9. **Pay-again** — new `stripe_subscription_id`; `status=active`;
   `canceled_at` cleared.

#### Fail

`POST /v1/billing/subscription/cancel` and
`POST /v1/billing/subscription/keep` **409** when `status=canceled`.

#### Mocked

Stripe.

### HappyPathBillingFull — frontend Full

Frontend. Vitest `HappyPathBillingFull`. Not OpenAPI 1:1.

#### Setup

Frontend (jsdom / Vitest, MSW, no Go). Tenant active after website
activation (09).

#### Exercise

Account menu → Usage & billing. Extra usage credit. Change plan.
Cancel. Keep subscription. Publish blocked jump. Remaining 0: billed
composer and Voice stop (cannot send / cannot start Voice). Website
editor copy PATCH via MSW **200**. MSW:
`GET /v1/billing/usage`,
`POST /v1/billing/extra-usage-credit/checkout`,
`POST /v1/billing/subscription/checkout`,
`POST /v1/billing/subscription/cancel`,
`POST /v1/billing/subscription/keep`,
`POST /v1/website/publications` (**402** `subscription_canceled` when
canceled).

#### Verify

UI: usage bar, **you are out of usage credit**, billed composer and
Voice stop, link to Usage & billing. Change plan **Current**,
**Cancels on**, Keep clears the flag, Publish blocked jump. Website
editor still accepts copy PATCH via MSW **200**. MSW saw those
Method+path strings. Postgres rows are the backend test.

#### Mocked

All HTTP via MSW.
