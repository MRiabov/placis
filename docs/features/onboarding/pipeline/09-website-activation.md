# 09 — Website activation

The contractor pays on the **website preview** (`/onboarding/preview-and-edit/`)
or on the **preview website address** strip if they shared (FQDN in
[cloudflare.md](../../website/cloudflare.md)). Clerk **create account** if needed (modal island); an existing
Clerk session skips to pay. Then Stripe checkout (island POSTs
`POST /v1/onboarding/activation/checkout` to `cmd/api`, CORS by `Host` /
`website_prefix` on the preview website address; on the app origin CORS is the
app. Not `/v1/website-previews/{token}/…`; do not bake a Checkout Session URL
into R2 HTML). The website-activation strip is
**sticky to the bottom of the viewport** while the website scrolls
([frontend.md](../frontend.md), [design decision](../design-decision-record.md) 10). Website activation **upgrades** the
existing unactivated tenant (`status=active`); it does not insert a second
tenant. Does **not** wait for 06. Does **not** require a prior 08 share.

Stripe (via `stripe-go`) handles this checkout only. Amount is the activation
price (predecessor: EUR 4900). `checkout.session.completed` is accepted only
after the SDK verifies the signature (`webhook.ConstructEvent`) and the metadata
matches (`tenant_id`, authenticated Clerk subject). The raw payload is saved on
`stripe_events`, the webhook **inserts** River job kind `website_activation`,
and the request returns. Activation can be replayed safely and is never
triggered by a browser success URL alone.

**Whoever pays becomes the owner.** Unauthenticated visitors may authenticate
and pay. First verified `checkout.session.completed` wins.

## Trigger

Verified Stripe `checkout.session.completed` for an unactivated tenant. Host
need not exist yet. Not a superseded 05-retry of a different in-flight checkout
that already lost.

## Pre

- `tenants.website_prefix` reserved at 08 **or** reserved in this step if they
  never shared.
- If they shared: `website_publications` v1 `active` (strip on) or a later
  onboarding write on that prefix.
- Authenticated Clerk subject (the payer).
- `onboarding_sessions.tenant_id` is the unactivated tenant from 01.

## Must not

- Insert a second `tenants` row.
- First-write child `tenant_id`s (website/media/profile already have it).
- Invent or rename `website_prefix`.
- Wait for 06.
- Activate twice (replay / second payer).
- Treat the browser success URL as activation.
- Leave v1 as a website-rollback target (archive it).
- Take the host down (not a 404).

## Do

This step **is** River job kind `website_activation`. Set
`tenants.status=active`, then **calls** `PublishWebsite` (strip off).

1. Load the unactivated [tenant](../../other/auth/persistence.md) on
   `onboarding_sessions.tenant_id`.
2. Resolve or create the Clerk organization; set `tenants.clerk_org_id`. Tenant
   name is the **business**; Clerk organization name is the **person**.
3. `tenant_memberships` (`owner`) for the paying owner.
4. `tenants.status=active`. Onboarding session → `activated`. In the
   **same transaction**, complete `ai.threads` `thread_kind=cms_assistant`
   `current` and end any `assistant.runs` `running` ([website editor](../website-editor.md)).
5. Write **`website_publications`** without the website-activation strip,
   `published_by=onboarding`, `active`. If they never shared: reserve
   `website_prefix` (same rules as 08) and write the **first** live R2
   **without** strip. If they already shared: archive v1 (strip on) and write
   live v2. HTML write is website
   [04](../../website/pipeline/04-website-publication.md) (strip flag off).
   Host stays up. Website address is a later CMS modal.
6. In-flight 06 **continues** on the same `tenant_id` as River-only. Do not
   cancel it. Do not append Assistant thread items. CMS assistant / PATCH are
   not 409-blocked for leftover 06. Host HTML stays the 08/09 R2 `latest/` (06
   does not live-update R2 after 08). Same website-slot overlap: last-write /
   `edit_history_conflict`.

## Inserts

`website_activation` (webhook **inserts**; this step **is** that River job
kind).

## Persist

`website_activations`; `stripe_events`; schema `jobs` River job kind
`website_activation`; **update** existing `tenants`;
`tenant_memberships`; complete unpaid `ai.threads` `thread_kind=cms_assistant`
`current` + end `running`; `website_publications` live (no strip) + archive
strip v1 if it existed; R2 `latest/` without the strip.

## Fail

Signature/metadata mismatch → ignore / 4xx; do not activate. Replay does not
activate twice. A second payer after the first verified completion is refused.

## Out

`/cms/website` with **Publish**. `/me` returns unactivated `TenantRead` after
Clerk org attach, then `status=active` after this step.
`/onboarding/preview-and-edit/` redirects to `/cms/website`. The preview website
address stays up without the strip (live website). If they never shared, 09
created that host. Unpublished website from 05 (+ 06 + 07 PATCHes)
is what they edit. First **owner** website publication is the next website
version and the first rollback-eligible website version.

### After website activation (billing)

Unpaid access to the application (never website-activated) is **forbidden**.
After activation, stopping the subscription price unpublishes the website and
blocks Publish; they can still edit. Copy later: **keep your Placis Pro plan
subscription to host the website**.

1. **One upfront pay** (this checkout; predecessor EUR 4900 stays until that
   epic).
2. Then a **subscription price** on a **subscription tier** (provisional
   catalogue: [billing PRD](../../billing/prd.md)). If they stop paying, the
   website is **unpublished** and they cannot **Publish** until the
   subscription is active again ([billing](../../billing/architecture.md)).
   CMS edit stays open (`tenants.status=active`).
3. **Do not commit to Clerk Billing yet.** Optimistic DB cache of subscription
   status; refresh when expected.
4. Monthly **usage credit** is visible on **Usage & billing** as **$**. Unused
   usage credit carries over. Our cost is **×5** to the owner: $50 shown ⇒ they
   can spend **$10** of our cost. Token / per-image invoices and **Voice** (xAI
   per-minute audio plus text-item fees) debit the same pool —
   [billing architecture](../../billing/architecture.md). Persist remaining
   usage credit on the AI use ledger; check it before billed work and before a
   billed realtime connection.

Currency for the website-activation pay stays as 09 specifies until that epic.
Usage credit display is **$** (provisional USD catalogue).

See [billing](../../billing/README.md).

## Invariants

- Same `tenant_id` as 01.
- Same `website_prefix` as 08.
- `/me` tenant only when `status=active`.
- Clerk organization 1-1 for **active** tenants only.
- v1 and v2 are never website-rollback targets.
