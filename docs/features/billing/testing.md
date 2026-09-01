# Billing — E2E test

One full-stack E2E when `internal/billing` lands. Drives `frontend-2`
(Playwright) against the real API + real Postgres; Stripe and the LLM
are faked. Voice settlement is not wall-clock. DB asserts name the
tables from [persistence.md](persistence.md). No Go tests in this docs
PR.

1. **Activate** — website activation succeeds (08).
   `website_activation` **calls** `ActivateSubscription`.
   - DB: **persists into** `billing.subscriptions`
     (`subscription_tier=pro`, `status=active`,
     `stripe_subscription_id` set);
     `ai_use_ledger_entries` `entry_kind=included_usage_credit` (Placis
     Pro plan catalogue). `tenants.subscription_status=active`.

2. **Billed work** — assistant text, image generate, and Voice minutes
   **call** `AssertUsageCredit` then `RecordAIUseSpend` (×5; usage
   categories Voice / Image / text edits).
   - DB: **persists into** `ai_use_ledger_entries` (`entry_kind=spend`,
     `usage_category`).
   - UI: Usage & billing (account menu) shows the bar split from
     `BillingUsageRead`.

3. **Carry-over** — `invoice.paid` **inserts**
   `billing_subscription_sync`; **calls** `AddIncludedUsageCredit`.
   Remaining is not zeroed.
   - DB: schema `jobs` River job kind `billing_subscription_sync`; a
     second `included_usage_credit` row; remaining is prior remaining
     plus the new included usage credit.

4. **20%** — remaining drops to 20% of the current pool
   (`BillingUsageRead`).
   - UI: shared notification (not Details OK / Revert); link to Usage &
     billing.

5. **Empty** — remaining hits 0.
   - HTTP: billed routes **402** `usage_credit_exhausted`
     (`AssertUsageCredit`).
   - UI: **you are out of usage credit**; extra usage credit Checkout
     restores billed work.
   - DB: schema `jobs` `billing_extra_usage_credit`;
     `extra_usage_credit` row after paid Checkout
     (`ApplyExtraUsageCredit`).

6. **Stopped paying** — `billing_subscription_sync` sets
   `subscriptions.status=canceled` and
   `tenants.subscription_status=canceled`. `canceled_at` is set.
   **Calls** `UnpublishWebsite`.
   - DB: no `website_publications.active`; R2 `latest/` is the holding
     HTML.
   - HTTP: `POST /v1/website/publications` and live website rollback
     **402** `subscription_canceled` (not `usage_credit_exhausted`).
   - UI: Publish dropdown **Publishing is blocked:** jump to Usage &
     billing. Website editor PATCH still works.
   - Pay-again: Change plan Checkout; **inserts**
     `billing_subscription_sync`; new `stripe_subscription_id`;
     `status=active`; `canceled_at` cleared. Publish succeeds.

7. **Change plan** — owner picks Placis Pro Plus plan (or month/year)
   while `active`. `CreateSubscriptionCheckout` Stripe update.
   - DB: `subscriptions.subscription_tier` updates; no extra
     `included_usage_credit` mid-period.
   - UI: Change plan grid marks the new current tier **Current**.

8. **Cancel** — owner cancels; period has not ended.
   `CancelSubscription`.
   - DB: `cancel_at_period_end=true`, `status=active`.
   - UI: **Cancels on** the period end; **Keep subscription**
     (`KeepSubscription`) clears the flag.
   - Publish still works.
   - After `current_period_end`: `status=canceled`, `canceled_at` set;
     same as beat 6.
