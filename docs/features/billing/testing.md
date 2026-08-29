# Billing — E2E test

One full-stack E2E when `internal/billing` lands. Drives `frontend-2`
(Playwright) against the real API + real Postgres; Stripe and the LLM are
faked. Voice settlement is not wall-clock. DB asserts name the tables from
[persistence.md](persistence.md). No Go tests in this docs PR.

1. **Activate** — website activation succeeds (08).
   - DB: `subscriptions` (`subscription_tier=pro`, `status=active`);
     `ai_use_ledger_entries` included grant for Placis Pro plan usage credit.

2. **Billed work** — assistant text, image generate, and Voice minutes debit
   ×5 into usage categories Voice / Image / text edits.
   - DB: spend rows on `ai_use_ledger_entries` with `usage_category`.
   - UI: Usage & billing (account menu) shows the bar split.

3. **Carry-over** — period rolls; remaining is not zeroed; a new included
   grant is added.
   - DB: a second `included_grant` row; remaining is prior remaining plus the
     new grant.

4. **20%** — remaining drops to 20% of the current pool.
   - UI: shared notification (not Details OK / Revert); link to Usage &
     billing.

5. **Empty** — remaining hits 0.
   - HTTP: billed routes **402** `usage_credit_exhausted`.
   - UI: **you are out of usage credit**; extra usage credit checkout restores
     billed work.
   - DB: `extra_usage_credit` row after paid checkout.

6. **Stopped paying** — `subscriptions.status=canceled` (and
   `tenants.subscription_status=canceled`).
   - Live website is unpublished.
   - HTTP: `POST /v1/website/publications` and live website rollback **402**
     `subscription_canceled` (not `usage_credit_exhausted`).
   - UI: Publish dropdown **Publishing is blocked:** jump to Usage & billing.
     Website editor PATCH still works.
   - After they pay again: `status=active`; Publish succeeds.

7. **Change plan** — owner picks Placis Pro Plus plan (or month/year).
   - DB: `subscriptions.subscription_tier` updates; no extra included grant
     mid-period.
   - UI: Change plan grid marks the new current tier **Current**.

8. **Cancel** — owner cancels; period has not ended.
   - DB: `cancel_at_period_end=true`, `status=active`.
   - UI: **Cancels on** the period end; **Keep subscription** clears the flag.
   - Publish still works.
   - After `current_period_end`: same as beat 6.
