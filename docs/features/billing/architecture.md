# Billing — architecture

Flows and states. Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).
Tables: [persistence.md](persistence.md). HTTP: [api.md](api.md). Look:
[design decision record](design-decision-record.md). Decisions:
[ADR.md](ADR.md).

Website activation Checkout (activation Price plus Pro month) is
[09](../onboarding/pipeline/09-website-activation.md). This feature owns
usage credit after that, catalogue cache, pay-again, cancel / keep, and
the non-payment unpublish clock.

## Named identifiers

HTTP (same spelling in spec, Go, and tests), `internal/billing/`:

- `GetBillingCatalog`
- `GetBillingUsage`
- `CreateExtraUsageCreditCheckout`
- `CreateSubscriptionCheckout`
- `CancelSubscription`
- `KeepSubscription`

Called from other packages:

- `AssertUsageCredit` — `internal/infrastructure/ai` **calls** this when
  `bill_usage=billed` (and when `bill-allow-out-of-balance` and
  remaining > 0) before the vendor call; exhausted on `billed` → **402**
  `usage_credit_exhausted`
- `RecordAIUseSpend` — `internal/infrastructure/ai` **persists into**
  `ai_use_ledger_entries` (`entry_kind=spend`) after a vendor-hit that
  records **their usage**. Features **must not** **call** this after an
  `ai` call. Debit is `amount_eur` (dated FX from the vendor invoice
  currency at debit; do not invent the FX source here)
- `BillUsageMode` / `bill_usage` —
  [glossary](../../glossary.md#billusagemode). Generic external spend
  (AI and ETL). How `ai` applies remaining 0:
  [AI layer](../../infrastructure/ai/README.md#billusagemode)
- `ActivateSubscription` — `website_activation` **calls** this after
  `tenants.status=active`. **Persists** `billing.subscriptions` from the 09
  Checkout (`stripe_customer_id`, `stripe_subscription_id`, Pro month). Does
  **not** create a second Stripe Subscription. Does **not** insert
  `included_usage_credit` (that is `invoice.paid` / `AddIncludedUsageCredit`)
- `ApplyExtraUsageCredit` — River job kind `billing_extra_usage_credit`
- `AddIncludedUsageCredit` — new-period `included_usage_credit` row
  (unique Stripe invoice id). **Reads** invoice / Checkout metadata
  `tenant_id` (may race `website_activation`)
- `SyncSubscriptionFromStripe` — River job kind
  `billing_subscription_sync`
- `SyncCatalogFromStripe` — River job kind `billing_catalog_sync`
- `UnpublishWebsite` — website package; billing **calls** it when the
  non-payment deadline job sets `status=canceled`, and when an
  owner-scheduled cancel reaches period end (clears
  `website_publications.active` on every website; R2 `latest/` is holding
  HTML)

Tables: [persistence.md](persistence.md). DTOs and Routes: [api.md](api.md).
River job kinds: [jobs.md](jobs.md).

## Stripe vs Postgres

Usage credit is **only** `ai_use_ledger_entries`. Remaining, ×5, Voice /
Image / text edits, 20% / empty, and **402** `usage_credit_exhausted`
never live on Stripe.

Stripe Product + Price is the charged amount. Postgres `billing.prices`
is the cache Checkout and `GetBillingCatalog` **read**. `product.*` /
`price.*` webhooks **insert** `billing_catalog_sync` (`event_id`); the
worker **reads** `stripe_events.payload` and upserts/deactivates **that**
row. Empty cache / boot **inserts** one full-list
`billing_catalog_sync`. Not `Prices.List` on Checkout or catalogue GET.
Not Clerk Billing. Not Stripe meters.

Stripe is also payment and the subscription-price clock: 09 Checkout
(`mode=subscription` plus one-time activation Price); extra usage credit
Checkout (`mode=payment`); pay-again Checkout (Pro month only); webhooks
(`invoice.paid`, `invoice.payment_failed`, subscription updated/deleted,
`charge.refunded`). Do **not** store remaining usage credit on Stripe.
`invoice.paid` **calls** `AddIncludedUsageCredit`. Optimistic
`tenants.subscription_status` and `billing.subscriptions` are the
product row (tenant ↔ `stripe_customer_id` / Subscription, 3-month clock,
occupancy) — not a Stripe JSON cache. Stripe is refreshed when a
webhook lands. The daily `billing_nonpayment_unpublish` job **retrieves**
Stripe at the deadline only (not on Publish).

## Pool

One usage credit pool per activated tenant. The AI use ledger is the
record of included usage credit, extra usage credit purchases, and
spends. Remaining is the sum of `included_usage_credit` and
`extra_usage_credit` minus `spend`. Do not store remaining on `tenants`.

At each paid monthly invoice, **calls** `AddIncludedUsageCredit` for the
cached Price’s `included_usage_credit_eur`. Do **not** zero remaining.
Unused usage credit carries over. Extra usage credit is already in the
pool, so it carries too. No expiry. No carry-over cap. The first 09 pay
includes one month of included usage credit (that same `invoice.paid`;
do not grant twice from `checkout.session.completed`). The access fee
does not add a second grant.

Owner markup is **×5** on **our cost** after conversion to EUR. Usage &
billing shows **their cost**, never ours. €50 shown ⇒ they can spend
**€10** of our cost.

Onboarding, including the onboarding guide, is **not** billed.

## AI vendor cost and AI voice vendor cost

Same ×5 into the pool.

**AI vendor cost** (OpenRouter / model / image invoices) — assistant
text, image generate/cleanup, ads generate. Not Voice minutes. Vendor
invoices are often USD; `ai_generations.cost_amount` /
`cost_currency` stay as invoiced. `RecordAIUseSpend` **persists into**
`amount_eur` at that scale (dated FX at debit).

**AI voice vendor cost** (xAI Speech to Speech) — not tokens and not
wall-clock of an open socket. xAI invoices
([pricing](https://docs.x.ai/developers/pricing),
[Speech to Speech](https://docs.x.ai/developers/models/speech-to-speech)):

1. **Per minute of audio sent or received** (both directions). Published
   2026-08-28: `grok-voice-think-fast-2.0` **$0.08 / min** ($4.80 / hr).
   Deprecated `grok-voice-think-fast-1.0` $0.05 / min. Pin a dated model
   id; do not ride `grok-voice-latest`. Live Voice uses the xAI region
   for the **business country** (`wss://{region}.api.x.ai/v1/realtime`;
   not a blanket eu-west-1, not the auto-routing global `api.x.ai`
   host).
2. **$0.004 per text `conversation.item.create`**. Not billed:
   `function_call_output` (our tool results) and items whose content is
   audio (those ride the audio minutes). `response.create` is not a
   billable event.
3. Do **not** enable xAI server-side `web_search` / `x_search` /
   collections / MCP (separate per-1k-call fees) or provisioned phone
   numbers (+$0.01 / min). Our tools are custom functions dispatched by
   Go.

Nested image or ads work from a Voice tool (cleanup, `generate_image`,
ads generate) is **additional** ×5, tagged Image or Text, not rolled
into the minute.

Go never sees PCM. Settle from `AssistantVoiceUsage` on
`POST /v1/assistant/voice/transcripts` (including a usage-only POST when
Voice turns off with no new visible text): `audio_seconds_sent`,
`audio_seconds_received`, `billed_text_item_count`
([assistant HTTP](../assistant/api.md)). Extra keys 4xx. Voice adapter
**calls** `RecordAIUseSpend`. Do **not** debit wall-clock of an open
socket (silence is not AI voice vendor cost). Do not add
`input_tokens` / `output_tokens` on that body.

Seed knowledge and profile in the realtime-connection **instructions**,
not as a stack of billed text items. Do not replay the assistant thread
as `conversation.item.create` rows.

## Spend tags

Each spend row has a usage category: `voice`, `image`, or `text`. Owner
copy for Text is **text edits**. Nested generate_image / cleanup / ads
generate during Voice are Image or Text.

## Usage & billing bar

The bar is the **current pool** (remaining + spent this period),
including carry-over. Filled length is spent this period (their cost),
split by usage category color. Unfilled is remaining. Informational.
Display may round; the AI use ledger does not.

## 20% and empty

Both use the shared **notification** (fixed bottom-right). Not the
Details OK / Revert pair. Frontend from `BillingUsageRead` remaining vs
pool.

- Remaining ≤ 20% of the current pool: warn. Billed work still runs.
  Link to Usage & billing.
- Remaining is 0: **you are out of usage credit**. Billed composer and
  Voice stop. Link to Usage & billing to buy extra usage credit.

**Calls** `AssertUsageCredit` inside `ai` when `bill_usage=billed`
before billed HTTP generate and before creating a billed realtime
connection. Exhausted → **402** `usage_credit_exhausted`.
Drop that connection when remaining hits 0. Transcripts settlement
**calls** `RecordAIUseSpend` inside the Voice adapter and stays **200**.

## Subscription

Optimistic `subscription_status` on `tenants` (`active` / `canceled` /
`none`). It stays `active` during the three-calendar-month non-payment
window. Do not put remaining usage credit or Price ids on `tenants`.

09 Checkout creates the Stripe `stripe_customer_id` and the Stripe Subscription.
`ActivateSubscription` **persists** that into `billing.subscriptions`
(`subscription_tier=pro`, `billing_interval=month`, `status=active`,
`stripe_customer_id`, `stripe_subscription_id`). One `stripe_customer_id` per
tenant; extra usage and pay-again attach to it.

**Failed pay** does not unpublish on the first
`invoice.payment_failed`. That event sets `nonpayment_started_at` if
null. `invoice.paid` clears the clock. After three calendar months,
daily `billing_nonpayment_unpublish` **retrieves** the Stripe
Subscription (and latest invoice). If Stripe shows paid (missed
webhook): clear `nonpayment_started_at`, grant included credit if that
invoice was not yet applied, do **not** unpublish. If still unpaid: set
`canceled` / `canceled_at` and **calls** `UnpublishWebsite`. Publish
still works during the window (**not** **402** `subscription_canceled`
until then). This Stripe GET is only on that job, not on Publish.

**Owner cancel** is still `cancel_at_period_end`. Until
`current_period_end` they stay `active` (Publish still works). **Keep
subscription** clears that flag. When the period ends after a scheduled
cancel, `status=canceled`, set `canceled_at`, **calls**
`UnpublishWebsite`, **402** `subscription_canceled`. That path is not
the three-month non-payment clock.

Website 01 occupancy: a canceled tenant still occupies until 6 months
after `canceled_at`. Unchanged and separate from the three-month clock.

**Pay-again** after `canceled` is `CreateSubscriptionCheckout`: Pro
month Checkout only (no activation Price). New Stripe Subscription,
`status=active`, `canceled_at` cleared, `stripe_subscription_id`
replaced, `stripe_customer_id` kept. Access fee is never charged again.

**Change plan** while `active` (Plus / Max / year / proration) is
deferred. Only Placis Pro plan / month is self-serve. Enterprise plan
is sales-led.

**Refunds** are money-only. `payment_status=refunded` on
`website_activations`. Tenant stays `status=active`. First payer stays
owner; refund does not reopen 09. Extra usage credit rows stay.

## Pricing

Pricing is on the Placis website (`/pricing/`). Astro static → R2. CI
`astro build` bakes choosable amounts from `GET /v1/billing/catalog`.
No Worker, no Stripe JS, no Go HTTP on `placis.com`. The website visitor never
hits Stripe or Go. Checkout is not on `placis.com`.

Choose on Placis Pro plan goes to `app.placis.com` (09 Checkout is
activation Price plus that Pro month Price). Yearly toggle is out of
this spec. Plus / Max are unspecified (`choosable=false` if cache rows
exist; no Choose). Enterprise plan → contact sales.

`GetBillingCatalog` **reads** `billing.prices` (choosable only). No
`stripe_customer_id`. No activation Price. Unauthenticated (auth mode **none**).
