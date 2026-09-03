# Billing — architecture

Flows and states. Named identifiers:
[docs conventions](../../docs-conventions.md#named-identifiers).
Tables: [persistence.md](persistence.md). HTTP: [api.md](api.md). Look:
[design decision record](design-decision-record.md). Decisions:
[ADR.md](ADR.md).

Website activation (one-time pay) is
[09](../onboarding/pipeline/09-website-activation.md). This feature owns
usage credit after that.

## Named identifiers

HTTP (same spelling in spec, Go, and tests), `internal/billing/`:

- `GetBillingUsage`
- `CreateExtraUsageCreditCheckout`
- `CreateSubscriptionCheckout`
- `CancelSubscription`
- `KeepSubscription`

Called from other packages:

- `AssertUsageCredit` — `internal/ai` **calls** this when
  `bill_usage=billed` (and when `bill-allow-out-of-balance` and
  remaining > 0) before the vendor call; exhausted on `billed` → **402**
  `usage_credit_exhausted`
- `RecordAIUseSpend` — `internal/ai` **persists into**
  `ai_use_ledger_entries` (`entry_kind=spend`) after a vendor-hit that
  records **their usage**. Features **must not** **call** this after an
  `ai` call
- `BillUsageMode` / `bill_usage` — [LLM layer](../../general-architecture/llm-layer.md#billusagemode)
- `ActivateSubscription` — `website_activation` **calls** this after
  `tenants.status=active`
- `ApplyExtraUsageCredit` — River job kind `billing_extra_usage_credit`
- `AddIncludedUsageCredit` — new-period `included_usage_credit` row
- `SyncSubscriptionFromStripe` — River job kind
  `billing_subscription_sync`
- `UnpublishWebsite` — website package; billing **calls** it when
  `status` becomes `canceled` (clears `website_publications.active`;
  R2 `latest/` is holding HTML)

Tables: [persistence.md](persistence.md). DTOs and Routes: [api.md](api.md).
River job kinds: [jobs.md](../../general-architecture/jobs.md).

## Stripe vs Postgres

Usage credit is **only** `ai_use_ledger_entries`. Remaining, ×5, Voice /
Image / text edits, 20% / empty, and **402** `usage_credit_exhausted`
never live on Stripe.

Stripe is payment and the subscription-price clock: 09 activation
Checkout; extra usage credit Checkout; Stripe Subscription for the
subscription price; webhooks (`invoice.paid`, subscription
updated/deleted). Do **not** store remaining usage credit on Stripe
(meters, usage records, Stripe balance, or Clerk Billing).
`invoice.paid` **calls** `AddIncludedUsageCredit`. Optimistic
`tenants.subscription_status` and `billing.subscriptions` are product
status; Stripe is refreshed when a webhook lands.

## Pool

One usage credit pool per activated tenant. The AI use ledger is the
record of included usage credit, extra usage credit purchases, and
spends. Remaining is the sum of `included_usage_credit` and
`extra_usage_credit` minus `spend`. Do not store remaining on `tenants`.

At the start of a subscription period, **calls**
`AddIncludedUsageCredit` for the current subscription tier. Do **not**
zero remaining. Unused usage credit carries over. Extra usage credit is
already in the pool, so it carries too. No expiry. No carry-over cap.
`amount_usd_cents` is the catalogue included usage credit at insert time
(Placis Pro plan $100 / Plus $400 / Max $1,500).

Owner markup is **×5** on **our cost**. Usage & billing shows **their
cost**, never ours. $50 shown ⇒ they can spend **$10** of our cost.

Onboarding, including the onboarding guide, is **not** billed.

## AI vendor cost and AI voice vendor cost

Same ×5 into the pool.

**AI vendor cost** (OpenRouter / model / image invoices) — assistant
text, image generate/cleanup, ads generate. Not Voice minutes.

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
`POST /v1/assistant/voice/transcripts` (including a usage-only POST when Voice
turns off with no new visible text): `audio_seconds_sent`,
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
`none`). `ActivateSubscription` creates the Stripe Subscription (not
the 09 activation Checkout), **persists into** `subscriptions`
(`subscription_tier=pro`, `status=active`, `stripe_subscription_id`) and
the first `included_usage_credit`. If they stop paying the subscription
price, **calls** `UnpublishWebsite`. They cannot do a **website
publication** (or live website rollback) until the subscription is
`active` again. That is **402** `subscription_canceled`, not
`usage_credit_exhausted`, and not 09 website activation (the tenant
stays `status=active`; CMS edit stays open). Self-serve tiers: Placis
Pro plan / Placis Pro Plus plan / Placis Pro Max plan. Enterprise plan
is sales-led.

**Change plan** and **Cancel subscription** are on Usage & billing, not
on placis.com. Change plan is a Stripe subscription update (or Checkout
when status is not `active`). The next `included_usage_credit` uses the
new subscription tier; do not insert a second `included_usage_credit`
mid-period. Cancel **persists into** `cancel_at_period_end`. Until
`current_period_end` they stay `active` (Publish still works). **Keep
subscription** clears that flag. When the period ends without pay,
`status=canceled`, set `canceled_at`, **calls** `UnpublishWebsite`,
**402** `subscription_canceled`. Website 01 occupancy: a canceled
tenant still occupies until 6 months after `canceled_at`. Pay-again is
Change plan Checkout: new Stripe subscription, `status=active`,
`canceled_at` cleared, `stripe_subscription_id` replaced.

## Pricing

Pricing is on the Placis website (`/pricing/`). Display only. Choose →
`app.placis.com`. Enterprise plan → contact sales. No Stripe on
`placis.com`.
