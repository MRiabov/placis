# Billing

**Stub.** These billing docs are a stub and will be rewritten completely. Keep
the meters and 402 rules below; do not treat this pack as Complete HTTP /
persistence. The CMS usage mock is `cms.html?scene=billing` (not a
`billing.html`). Left-nav place stays unset until that rewrite.

Usage credit and the CMS **usage** screen (the **$** credit). Stripe retainer /
website activation checkout is still triggered from [08](../onboarding/pipeline/08-website-activation.md); this feature owns the
ledger those charges, generation hops, and CMS voice minutes debit.

Do not put `usage_credit_usd_cents` on [auth](../other/auth/persistence.md). Never use subscription-shelf
copy.

- [persistence.md](persistence.md) — usage credit ledger (schema with `internal/billing/`)
- [api.md](api.md)
- [design decision record](design-decision-record.md) — left-nav placement for the usage screen

CMS assistant and Ads Review orbs debit this ledger. Owner markup is **×5** on
**our cost**. Onboarding, including the onboarding assistant, is **not** billed
(we still record `ai_generations`). Assistant: [assistant](../assistant/README.md). Voice transport:
[voice agent](../../general-architecture/voice-agent.md).

## Meters

Do not treat Voice as a generation hop. Two cost shapes, same **×5**:

**Generation hop** — text turns (`LLMProvider`), image generate/cleanup, ads
generate, and any other Vercel / model token or per-image invoice.
$50 shown ⇒ they can spend **$10** of that hop cost.

**Voice (xAI Speech to Speech)** — not tokens and not wall-clock of an open
socket. xAI invoices
([pricing](https://docs.x.ai/developers/pricing),
[Speech to Speech](https://docs.x.ai/developers/models/speech-to-speech)):

1. **Per minute of audio sent or received** (both directions). Published
   2026-08-28: `grok-voice-think-fast-2.0` **$0.08 / min**
   ($4.80 / hr). Deprecated `grok-voice-think-fast-1.0` $0.05 / min. Pin a dated
   model id; do not ride `grok-voice-latest`.
2. **$0.004 per text `conversation.item.create`**. Not billed:
   `function_call_output` (our tool results) and items whose content is audio
   (those ride the audio meter). `response.create` is not a billable event.
3. Do **not** enable xAI server-side `web_search` / `x_search` / collections /
   MCP (separate per-1k-call fees) or provisioned phone numbers (+$0.01 / min).
   Our tools are custom functions dispatched by Go.

Nested hops from a voice tool (cleanup, `generate_image`, ads generate) are
**additional** hop **×5**, not rolled into the minute.

Go never sees PCM. xAI's Speech to Speech docs do **not** attach a token-style
usage object on `response.done`. Settle from
**measured audio duration both directions** (audio we sent + audio we received)
plus the count of billed text `conversation.item.create` events, posted on
`POST /v1/assistant/transcripts` (including a usage-only POST when Voice turns
off with no new visible text) and when the realtime connection closes. Prefer an
xAI usage payload if one appears later. Do **not** debit wall-clock of an open
socket (silence is not the audio meter). Do not invent `input_tokens` /
`output_tokens` from minutes. Check remaining credit before CMS
realtime-connection create (**402** if exhausted); drop that connection when
credit is exhausted.

Seed knowledge and profile in the realtime-connection **instructions**, not as a
stack of billed text items. Do not replay the assistant thread as
`conversation.item.create` rows.
