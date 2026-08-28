# Billing — persistence

**Stub.** These billing docs are a stub and will be rewritten completely. Do not
treat table names below as locked.

Usage credit ledger. Conventions:
[persistence conventions](../../general-architecture/persistence.md).
Go package `internal/billing/`. Auth stays Clerk / tenant membership — **not**
this schema.

Stub: one ledger per activated tenant (balance in USD cents). Assistant and ads
**debit** it; Stripe checkout **credits** it. Voice debit is settled
**audio minutes + text-item fees** from xAI usage (×5), not a fake token hop.
Exact table names land with the billing implementation PR. Assistant thread
tables do not store credit.
