# 09 — Website activation (integration test)

Pays, upgrades the tenant, and **calls** website 04 (strip off). Leftover
06 stays River job kind `website_copy_generation`. The webhook **inserts**
`website_activation`.

- **Setup**: unpublished website from 05; wait-end on
  `/onboarding/preview-and-edit/`. 08 share is **optional**. A Clerk
  testing-token contractor (Clerk organization may be missing).
  Automatic website copy generation may still be running, or may have
  failed — neither blocks website activation. Record: if 08 ran,
  v1 `website_publications` `active`; the `website_copy_generation` job
  row if still in flight.
- **Invoke**: public checkout POST (app origin **or** CORS by `Host` /
  `website_prefix` if they shared); deliver
  `checkout.session.completed` (Stripe SDK signature against a test
  key); replay it; attempt a second payer after the first verified
  completion. Also: pay with no prior 08.
- **Assert** (Postgres):
  - `website_activations` written (`tenant_id`,
    `onboarding_session_id`, `payment_status=paid`,
    `checkout_session_id`).
  - `stripe_events` stored (`event_id` unique, `processed`).
  - Schema `jobs` had River job kind `website_activation` on that
    `tenant_id` (webhook **inserts**; worker ran 04).
  - Same `tenants` row as business lookup: `clerk_org_id` set,
    `status=active` (not a second tenant). `tenant_memberships`
    (`owner`).
  - `onboarding_sessions.status=activated`.
  - Unpaid `ai.threads` `thread_kind=cms_assistant` `current`
    completed and `assistant.runs` `running` ended in the **same**
    transaction.
  - **Website 04 (strip off):** `website_publications` live row
    `published_by=onboarding`, `active=true`, `website_manifest`
    still tokenized. If they shared: prior v1 `archived` /
    `active=false`; this is v2. If they never shared:
    `tenants.website_prefix` reserved here; this is v1 without strip.
  - Unpublished website slots still tokens (no HTML write-back).
  - Replay does not insert a second `website_activations` paid row /
    does not activate twice. Second payer refused.
  - In-flight 06: schema `jobs` still has that unique-key job on
    `tenant_id` (not cancelled); no new `assistant.thread_items` from
    this pay; CMS assistant POSTs / PATCH are not 409 because 06 is
    running.
  - `/onboarding/preview-and-edit/` redirects to `/cms/website`.
  - **Spy:** fake R2 `latest/` without the strip; fake purge as
    website 04.
- **Handoff**: tenant is `active`; live host is R2 `latest/`; CMS
  Publish is a later website 04 (`published_by=owner`). Leftover 03
  continues River-only.
- **Fail**: invalid Stripe signature → no `website_activations` paid
  row; tenant still `unactivated`; no new `website_publications`.
- **Mocked**: Stripe test mode (no real charge). Website 04 as 08 (real
  Worker `websitePublication`; R2 / purge faked).
