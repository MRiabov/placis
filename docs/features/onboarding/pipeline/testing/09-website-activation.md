# 09 — Website activation (integration test)

Pays, upgrades the tenant, and **calls** website 04 (strip off). Leftover
06 stays River job kind `website_copy_generation`. The webhook **inserts**
`website_activation`.

- **Setup**: unpublished website from 05; wait-end
  (`onboarding_sessions.status=preview_and_edit`). 08 share is
  **optional**. A Clerk testing-token contractor. `billing.prices` has an
  active activation Price and a choosable Placis Pro plan / month Price.
  Checkout **calls**
  `AttachClerkOrganization` (`tenants.clerk_org_id` set; `status` still
  `unactivated`) before Stripe. Automatic website copy generation may
  still be running, or may have failed — neither blocks website
  activation. Record: if 08 ran, v1 `website_publications` `active`;
  the `website_copy_generation` job row if still in flight.
- **Exercise**: `POST /v1/onboarding/activation/checkout` (app origin
  **or** CORS by `Host` /
  `website_prefix` if they shared); deliver
  `checkout.session.completed` (Stripe SDK signature against a test
  key); replay it; attempt a second payer after the first verified
  completion. Also: pay with no prior 08.
- **Verify** (Postgres):
  - `website_activations` written (`tenant_id`,
    `onboarding_session_id`, `payment_status=paid`,
    `checkout_session_id`, `amount_eur` from the cached activation
    Price).
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
    `websites.website_prefix` already reserved; this is v1 without strip.
  - Unpublished website slots still tokens (no HTML write-back).
  - Replay does not insert a second `website_activations` paid row /
    does not activate twice. Second payer refused. Refund after pay:
    `payment_status=refunded`; tenant stays `active`; 09 does not
    reopen.
  - In-flight 06: schema `jobs` still has that unique-key job on
    `website_id` (not cancelled); no new `assistant.thread_items` from
    this pay; CMS assistant POSTs / PATCH are not 409 because 06 is
    running.
  - **Spy:** MinIO `latest/` without the strip; fake purge as
    website 04.
  - Checkout line items were the cached activation Price plus Placis
    Pro plan / month Price (not a Go 4900; no `price_data`).
  - `billing.subscriptions` (Placis Pro plan / month, `status=active`,
    `stripe_customer_id` set, `stripe_subscription_id` set). First
    `invoice.paid` **persists into** `ai_use_ledger_entries`
    `entry_kind=included_usage_credit` (`stripe_invoice_id` unique).
    Replay of that invoice does not insert a second grant.
    `tenants.subscription_status=active`.
- **Handoff**: tenant is `active`; live host is R2 `latest/`; CMS
  Publish is a later website 04 (`published_by=owner`). Leftover 03
  continues River-only.
- **Fail**: invalid Stripe signature → no `website_activations` paid
  row; tenant still `unactivated`; no new `website_publications`.
- **Mocked**: Stripe test mode (no real charge). Website 04 as 08 (real
  Worker `websitePublication`; MinIO real; purge faked).
