# Billing — architecture

Flows and states. Tables: [persistence.md](persistence.md). HTTP: [api.md](api.md). Look:
[design decision record](design-decision-record.md). Decisions: [ADR.md](ADR.md).

Website activation (one-time pay) is [08](../onboarding/pipeline/08-website-activation.md). This feature owns usage credit after
that.

## Pool

One usage credit pool per activated tenant. The AI use ledger is the record of
grants, extra usage credit purchases, and spends. Remaining is the sum of
grants and extra usage credit minus spends. Do not store remaining on
`tenants`.

At the start of a subscription period, add the included grant for the current
subscription tier. Do **not** zero remaining. Unused usage credit carries over.
Extra usage credit is already in the pool, so it carries too. No expiry. No
carry-over cap.

Owner markup is **×5** on **our cost**. Usage & billing shows **their cost**,
never ours. $50 shown ⇒ they can spend **$10** of our cost.

Onboarding, including the onboarding guide, is **not** billed.

## AI vendor cost and AI voice vendor cost

Same ×5 into the pool.

**AI vendor cost** (OpenRouter / model / image invoices) — assistant text,
image generate/cleanup, ads generate. Not Voice minutes.

**AI voice vendor cost** (xAI Speech to Speech) — not tokens and not wall-clock
of an open socket. xAI invoices
([pricing](https://docs.x.ai/developers/pricing),
[Speech to Speech](https://docs.x.ai/developers/models/speech-to-speech)):

1. **Per minute of audio sent or received** (both directions). Published
   2026-08-28: `grok-voice-think-fast-2.0` **$0.08 / min** ($4.80 / hr).
   Deprecated `grok-voice-think-fast-1.0` $0.05 / min. Pin a dated model id; do
   not ride `grok-voice-latest`. Live Voice uses the xAI region for the
   **business country** (not a blanket eu-west-1, not the global `api.x.ai`
   host).
2. **$0.004 per text `conversation.item.create`**. Not billed:
   `function_call_output` (our tool results) and items whose content is audio
   (those ride the audio minutes). `response.create` is not a billable event.
3. Do **not** enable xAI server-side `web_search` / `x_search` / collections /
   MCP (separate per-1k-call fees) or provisioned phone numbers (+$0.01 / min).
   Our tools are custom functions dispatched by Go.

Nested image or ads work from a Voice tool (cleanup, `generate_image`, ads
generate) is **additional** ×5, tagged Image or Text, not rolled into the
minute.

Go never sees PCM. xAI's Speech to Speech docs do **not** attach a token-style
usage object on `response.done`. Settle from
**measured audio duration both directions** (audio we sent + audio we received)
plus the count of billed text `conversation.item.create` events, posted on
`POST /v1/assistant/voice/transcripts` (including a usage-only POST when Voice
turns off with no new visible text) and when the realtime connection closes.
Prefer an xAI usage payload if one appears later. Do **not** debit wall-clock of
an open socket (silence is not AI voice vendor cost). Do not invent
`input_tokens` / `output_tokens` from minutes.

Seed knowledge and profile in the realtime-connection **instructions**, not as
a stack of billed text items. Do not replay the assistant thread as
`conversation.item.create` rows.

## Spend tags

Each spend row has a usage category: `voice`, `image`, or `text`. Owner copy
for Text is **text edits**. Nested generate_image / cleanup / ads generate
during Voice are Image or Text.

## Usage & billing bar

The bar is the **current pool** (remaining + spent this period), including
carry-over. Filled length is spent this period (their cost), split by usage
category color. Unfilled is remaining. Informational.

## 20% and empty

Both use the shared **notification** (fixed bottom-right). Not the Details OK /
Revert pair.

- Remaining ≤ 20% of the current pool: warn. Billed work still runs. Link to
  Usage & billing.
- Remaining is 0: **you are out of usage credit**. Billed composer and Voice
  stop. Link to Usage & billing to buy extra usage credit.

Check remaining usage credit before billed HTTP and before creating a billed
realtime connection. Exhausted → **402** `usage_credit_exhausted`. Drop that
connection when remaining hits 0.

## Subscription

Optimistic `subscription_status` on `tenants` (`active` / `canceled` /
`none`). If they stop paying the subscription price, unpublish the website.
They cannot do a **website publication** (or live website rollback) until the
subscription is `active` again. That is **402** `subscription_canceled`, not
`usage_credit_exhausted`, and not 08 website activation (the tenant stays
`status=active`; CMS edit stays open). Self-serve tiers: Placis Pro plan /
Placis Pro Plus plan / Placis Pro Max plan. Enterprise plan is sales-led.

**Change plan** and **Cancel subscription** are on Usage & billing, not on
placis.com. Change plan is a Stripe subscription update (or checkout when
status is not `active`). The next included grant uses the new subscription
tier; do not insert a second included grant mid-period. Cancel sets
`cancel_at_period_end`. Until `current_period_end` they stay `active` (Publish
still works). **Keep subscription** clears that flag. When the period ends
without pay, `status=canceled`, unpublish, **402** `subscription_canceled`.

## Pricing

Pricing is on the Placis website (`/pricing/`). Display only. Choose →
`app.placis.com`. Enterprise plan → contact sales. No Stripe on `placis.com`.
