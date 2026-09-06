# File trees — billing

Usage & billing after website activation. 09 Checkout stays onboarding
HTTP. High-level:
[module layout](../../general-architecture/module-layout.md),
[frontend stack](../../general-architecture/frontend-stack.md).
[architecture.md](architecture.md). Omit `*_test.go` / `*.test.*`.

`infrastructure/ai` **calls** `AssertUsageCredit` /
`RecordAIUseSpend`. Features must not **call** `RecordAIUseSpend`
after an `ai` call.

## Backend

```text
internal/billing/
  api.go                            # Register + picks helper
                                    # GetBillingCatalog (auth none)
                                    # GetBillingUsage
                                    # CreateExtraUsageCreditCheckout
                                    # CreateSubscriptionCheckout
                                    # CancelSubscription / KeepSubscription
  dto.go
  service.go                        # AssertUsageCredit, RecordAIUseSpend,
                                    # ActivateSubscription,
                                    # AddIncludedUsageCredit
                                    # (website_activation **calls**
                                    # ActivateSubscription)
  jobs.go                           # billing_extra_usage_credit,
                                    # billing_subscription_sync,
                                    # billing_catalog_sync,
                                    # billing_nonpayment_unpublish
                                    # (**calls** UnpublishWebsite)
  fake.go                           # Stripe (Checkout / webhooks)
  store/                            # sqlc for schema billing
    queries.sql                     # prices, subscriptions,
                                    # ai_use_ledger_entries
```

Stripe webhook HTTP is onboarding `api/activation.go`; that Register
**inserts** these River job kinds.

## Frontend

Account menu, not a left-nav peer. Folder is `cms/billing/` (not
`usage-and-billing`). Look export `/cms/billing`.

```text
frontend-3/src/features/cms/billing/
  Billing.tsx                       # /cms/billing Usage & billing
```
