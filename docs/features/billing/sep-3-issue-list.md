# Sep 3 issue list — Billing

Punch list from the 2026-09-03 unused-spec audit. Not canonical. Line
numbers are as of that audit. Fix the cited spec, then delete the item.
Delete this file when empty.

Usage-credit half is tight. Waste is the subscription half vs “Stripe is
activation checkout only”, plus Pricing that nothing reads.

## High

1. **Public Pricing tier + month/year selection has no consumer**
   Issue: functionality. Action: mark Pricing display-only (already
   almost said), or pass the choice into onboarding 09.
   Where:

   - [prd.md](prd.md) lines 24–26, 89–90
   - [architecture.md](architecture.md) lines 179–181 (“Display only.
     Choose → `app.placis.com`”)
   - [design-decision-record.md](design-decision-record.md) lines 24, 39
   - [../onboarding/pipeline/09-website-activation.md](../onboarding/pipeline/09-website-activation.md)
     line 125 (`ActivateSubscription` hardcodes Placis Pro plan)

2. **Yearly `billing_interval` has no monthly credit clock**
   Issue: persistence + DTO. Action: drop `year`, or specify a monthly
   grant independent of Stripe invoices.
   Where:

   - [persistence.md](persistence.md) lines 26, 31
   - [api.md](api.md) lines 26–33
   - [prd.md](prd.md) goal 2 (subscription includes **monthly** usage
     credit)
   - Included credit is `invoice.paid` → `AddIncludedUsageCredit`
     ([../../general-architecture/jobs.md](../../general-architecture/jobs.md))

3. **Activation payment leftovers (owned in onboarding persistence)**
   Issue: persistence. Action: see
   [../onboarding/sep-3-issue-list.md](../onboarding/sep-3-issue-list.md)
   item 8. Billing cares because webhook/docs mention them.
   Where:

   - `payment_status=refunded` — no refund event
   - `failure_reason`, `activated_at` — not on
     `WebsiteActivationStatusRead`
   - `stripe_events.processed` — unique `event_id` + River keys already
     replay-safe
   - `WebsiteActivationStatusRead.checkout_url` duplicates POST checkout

4. **`BillingUsageRead.spent_this_period_usd_cents`**
   Issue: DTO. Action: drop; it is `spent_voice + spent_image + spent_text`.
   Where: [api.md](api.md) line 26; [architecture.md](architecture.md)
   (bar uses pool total + three segments).

5. **Clerk Billing / Stripe meters bans restated five times**
   Issue: docs. Action: keep once (ADR); drop echoes.
   Where: [prd.md](prd.md) line 46; [ADR.md](ADR.md);
   [api.md](api.md) lines 62, 65; [architecture.md](architecture.md).

## Medium — product call

6. **Subscription lifecycle vs activation-only Stripe**
   Issue: scope. Action: decide.

   If Stripe is activation-checkout-only: cut
   `billing.subscriptions`, `POST /v1/billing/subscription/checkout`,
   `/cancel`, `/keep`, `billing_subscription_sync`,
   `tenants.subscription_status`, `402 subscription_canceled`,
   `UnpublishWebsite` dunning, occupancy keyed on `canceled_at`. Give
   included usage credit a new clock (activation grant + extra-credit
   only).

   If subscription is in scope: update
   [../../general-prd.md](../../general-prd.md) and item 1 (Pricing
   choice).

   Where: [architecture.md](architecture.md) lines 149–176;
   [api.md](api.md) lines 41–54; [persistence.md](persistence.md)
   lines 23–43; [prd.md](prd.md) goals 2, 4, 5.

7. **Three tiers + Change plan overlap extra usage credit**
   Issue: functionality. Action: keep tiers as sales display; drop
   in-app tier switching if tier gates no capability.
   Where: [prd.md](prd.md) catalogue; [architecture.md](architecture.md)
   line 161. No route or limit is gated on `subscription_tier`.

8. **`POST /v1/billing/subscription/keep`**
   Issue: API. Action: Cancel terminal-at-period-end + re-subscribe via
   Change plan removes the route, `cancel_at_period_end`, and two UI
   states.
   Where: [api.md](api.md) line 45; [testing.md](testing.md) lines 45,
   116, 149, 172; [architecture.md](architecture.md) line 21.

9. **`subscription_price_usd_cents` is derivable**
   Issue: DTO. Action: keep iff grandfathered pricing is real; then the
   catalogue is not grid truth.
   Where: [api.md](api.md) line 26.

10. **EUR 4900 activation vs USD catalogue** Issue: contradiction. Action: one
    currency; drop unused `website_activations.amount` / `currency`. Where:
    [../onboarding/pipeline/09-website-activation.md](../onboarding/pipeline/09-website-activation.md); [prd.md](prd.md) line 55 (USD).

11. **Stale “08” in billing PRD**
    Issue: contradiction. Action: activation is 09.
    Where: [prd.md](prd.md) lines 44, 68; [ADR.md](ADR.md).
    [README.md](README.md) already says 09.

12. **`ai_use_ledger_entries.period_started_at`**
    Issue: persistence. Action: name the query, or drop.
    Where: [persistence.md](persistence.md).

## Keep

- Signature-verified `POST /v1/webhooks/stripe`, `stripe_events`,
  `website_activation` job. Never trust the browser success URL.
- Activation checkout POST + status GET.
- AI use ledger, `AssertUsageCredit`, `402 usage_credit_exhausted`, ×5
  markup, one pool, carry-over, extra usage credit.
- `GET /v1/billing/usage` and the one bar.
- Voice settlement on transcripts POST.
- No Clerk Billing, no Stripe meters as the pool, no auto-reload, no
  our-cost on screen.
- `/pricing/` static, no Stripe on `placis.com`.
