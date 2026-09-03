# Billing

Usage credit, subscription price, Usage & billing, and Pricing on the Placis
website. Website activation one-time Stripe stays in
[09](../onboarding/pipeline/09-website-activation.md). This feature does not
steal `website_activations` or activation checkout.

The mock is [`apps/demo/`](../../../apps/demo/README.md) `/cms/billing`. Open Usage & billing from the account
menu (user icon). The left-nav **Usage** row stays hidden.

Do not put remaining usage credit on [auth](../other/auth/persistence.md). Never use predecessor dashboard
Usage & billing copy. Do not say **ledger**; the Internal name is
**AI use ledger**.

Owner markup is **×5** on **our cost**. Onboarding, including the onboarding
guide, is **not** billed (we still record `ai_generations`). Assistant:
[assistant](../assistant/README.md). Voice transport: [voice agent](../../general-architecture/voice-agent.md). **AI vendor cost**,
**AI voice vendor cost**, and 402: [architecture](architecture.md) (Voice settles on
`POST /v1/assistant/voice/transcripts`). If they stop paying, unpublish every
website and block Publish ([website](../website/frontend.md)). Change plan and Cancel subscription are
on Usage & billing.

- [plans.md](plans.md) — self-serve website counts
- [prd.md](prd.md)
- [ADR.md](ADR.md)
- [architecture.md](architecture.md)
- [persistence.md](persistence.md) — AI use ledger (schema `billing`)
- [api.md](api.md)
- [frontend.md](frontend.md) — Usage & billing
- [design decision record](design-decision-record.md)
- [testing.md](testing.md)
- Placis website [ADR](../placis-website/ADR.md) — **Pricing** at `/pricing/`
- [sep-3-issue-list.md](sep-3-issue-list.md) — Sep 3 issue list (keep /
  doc gap / drop)
